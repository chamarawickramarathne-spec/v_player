import { useEffect, useRef, useCallback } from "react";
import {
  init,
  command,
  setProperty,
  observeProperties,
  listenEvents,
  destroy,
  type MpvConfig,
  type MpvEvent,
} from "tauri-plugin-libmpv-api";
import { usePlayerStore } from "../stores/playerStore";
import { useSettingsStore } from "../stores/settingsStore";
import { getMediaType, isMediaFile, normalizePath } from "../lib/media";
import type { PlaylistItem, PlayerState } from "../types";

const TIME_POS_MIN_MS = 100;

const OBSERVED_PROPERTIES = [
  ["pause", "flag"],
  ["time-pos", "double", "none"],
  ["duration", "double", "none"],
  ["media-title", "string", "none"],
  ["filename", "string", "none"],
  ["volume", "double"],
  ["mute", "flag"],
  ["speed", "double"],
  ["playlist-pos", "int64", "none"],
  ["track-list", "node"],
] as const;

export function useMpv() {
  const mpvInitialized = useRef(false);

  // Initialize mpv on mount
  useEffect(() => {
    if (mpvInitialized.current) return;

    const { settings } = useSettingsStore.getState();

    const mpvConfig: MpvConfig = {
      initialOptions: {
        vo: "gpu",
        hwdec: settings.hwdec,
        "keep-open": "yes",
        volume: Math.round(settings.volume * 100),
        cache: "yes",
        "cache-secs": "30",
        "demuxer-max-bytes": "104857600",
        "demuxer-max-back-bytes": "52428800",
        "demuxer-readahead-secs": "10",
      },
      observedProperties: OBSERVED_PROPERTIES,
    };

    init(mpvConfig)
      .then(() => {
        mpvInitialized.current = true;
        console.log("mpv initialized successfully");

        let lastTimePosMs = 0;

        observeProperties(OBSERVED_PROPERTIES, ({ name, data }) => {
          const store = usePlayerStore.getState();
          switch (name) {
            case "pause":
              if (data === true) {
                store.setPaused(true);
              } else {
                store.setPlaying(true);
              }
              break;
            case "time-pos":
              if (data !== null) {
                const now = performance.now();
                if (!store.isPaused && now - lastTimePosMs < TIME_POS_MIN_MS) break;
                lastTimePosMs = now;
                store.setCurrentTime(data as number);
              }
              break;
            case "duration":
              if (data !== null) store.setDuration(data as number);
              break;
            case "media-title":
              if (data !== null) store.setMediaTitle(data as string);
              break;
            case "filename":
              if (data !== null) {
                store.setMediaType(getMediaType(data as string));
              }
              break;
            case "volume":
              if (typeof data === "number") store.setVolume(data / 100);
              break;
            case "mute":
              store.setMuted(data === true);
              break;
            case "speed":
              if (typeof data === "number") store.setSpeed(data);
              break;
            case "playlist-pos":
              if (data !== null) store.setPlaylistIndex(data as number);
              break;
            case "track-list":
              if (Array.isArray(data)) {
                usePlayerStore.setState({
                  trackList: data.map((t: any) => ({
                    id: t.id,
                    type: t.type,
                    lang: t.lang || "",
                    name: t.title || "",
                    decoder: t.decoder || "",
                    selected: t.selected || false,
                  })),
                });
              }
              break;
          }
        });

        // Listen for mpv events (eof, start-file, etc.)
        listenEvents((event: MpvEvent) => {
          if (event.event === "end-file") {
            const reason = (event as any).reason;
            if (reason === "eof") {
              // Auto-advance playlist on end of file
              const store = usePlayerStore.getState();
              const nextIndex = store.playlistIndex + 1;
              if (nextIndex < store.playlist.length) {
                // Play next item
                const nextItem = store.playlist[nextIndex];
                command("loadfile", [nextItem.path, "replace"]).then(() => {
                  store.setPlaylistIndex(nextIndex);
                  store.setFilePath(nextItem.path);
                  store.setMediaType(nextItem.mediaType as PlayerState["mediaType"]);
                }).catch(console.error);
              } else {
                // Last item finished - stop
                store.setStopped(true);
              }
            }
          }
        });

        // Restore volume from settings
        command("set", ["volume", Math.round(settings.volume * 100)]).catch(
          console.error
        );
      })
      .catch((err) => {
        console.error("Failed to initialize mpv:", err);
      });

    return () => {
      if (mpvInitialized.current) {
        destroy().catch(console.error);
        mpvInitialized.current = false;
      }
    };
  }, []);

  const openFile = useCallback(async (filePath: string) => {
    if (!mpvInitialized.current) return;
    try {
      await command("loadfile", [filePath, "replace"]);
      const mediaType = getMediaType(filePath);
      usePlayerStore.getState().setFilePath(filePath);
      usePlayerStore.getState().setMediaType(mediaType);
      usePlayerStore.getState().setPlaying(true);
    } catch (err) {
      console.error("Failed to open file:", err);
    }
  }, []);

  /** Returns first path to auto-open when playlist was empty; otherwise null. */
  const addToPlaylist = useCallback(async (paths: string[]): Promise<string | null> => {
    const store = usePlayerStore.getState();
    const existing = new Set(store.playlist.map((item) => normalizePath(item.path)));
    const newItems: PlaylistItem[] = [];

    for (const path of paths) {
      if (!isMediaFile(path)) continue;
      const key = normalizePath(path);
      if (existing.has(key)) continue;
      existing.add(key);
      newItems.push({
        path,
        name: path.split(/[\\/]/).pop() || path,
        mediaType: getMediaType(path),
      });
    }

    if (newItems.length === 0) return null;

    const wasEmpty = store.playlist.length === 0;
    usePlayerStore.setState({
      playlist: [...store.playlist, ...newItems],
      ...(wasEmpty ? { playlistIndex: 0 } : {}),
    });

    return wasEmpty ? newItems[0].path : null;
  }, []);

  const togglePlay = useCallback(async () => {
    if (!mpvInitialized.current) return;
    try {
      const isPaused = usePlayerStore.getState().isPaused;
      await setProperty("pause", !isPaused);
    } catch (err) {
      console.error("Toggle play failed:", err);
    }
  }, []);

  const stop = useCallback(async () => {
    if (!mpvInitialized.current) return;
    try {
      await command("stop");
      usePlayerStore.getState().setStopped(true);
    } catch (err) {
      console.error("Stop failed:", err);
    }
  }, []);

  const seek = useCallback(async (time: number) => {
    if (!mpvInitialized.current) return;
    try {
      await command("seek", [time, "absolute"]);
      usePlayerStore.getState().setCurrentTime(time);
    } catch (err) {
      console.error("Seek failed:", err);
    }
  }, []);

  const seekRelative = useCallback(async (offset: number) => {
    if (!mpvInitialized.current) return;
    try {
      await command("seek", [offset, "relative"]);
    } catch (err) {
      console.error("Seek relative failed:", err);
    }
  }, []);

  const setVolume = useCallback(async (vol: number) => {
    if (!mpvInitialized.current) return;
    const clamped = Math.max(0, Math.min(1, vol));
    try {
      await setProperty("volume", Math.round(clamped * 100));
    } catch (err) {
      console.error("Set volume failed:", err);
    }
  }, []);

  const toggleMute = useCallback(async () => {
    if (!mpvInitialized.current) return;
    try {
      const currentMute = usePlayerStore.getState().isMuted;
      await setProperty("mute", !currentMute);
    } catch (err) {
      console.error("Toggle mute failed:", err);
    }
  }, []);

  const setSpeed = useCallback(async (speed: number) => {
    if (!mpvInitialized.current) return;
    try {
      await setProperty("speed", speed);
    } catch (err) {
      console.error("Set speed failed:", err);
    }
  }, []);

  const setFullscreen = useCallback(async (fs: boolean) => {
    usePlayerStore.getState().setFullscreen(fs);
  }, []);

  const nextFrame = useCallback(async () => {
    if (!mpvInitialized.current) return;
    try {
      await setProperty("pause", true);
      await command("frame-step");
    } catch (err) {
      console.error("Next frame failed:", err);
    }
  }, []);

  const prevFrame = useCallback(async () => {
    if (!mpvInitialized.current) return;
    try {
      await setProperty("pause", true);
      await command("frame-back-step");
    } catch (err) {
      console.error("Prev frame failed:", err);
    }
  }, []);

  const loadScreenshot = useCallback(async (_path: string) => {
    if (!mpvInitialized.current) return;
    try {
      await command("screenshot-to-file", [_path]);
    } catch (err) {
      console.error("Screenshot failed:", err);
    }
  }, []);

  const loadSubtitle = useCallback(async (path: string) => {
    if (!mpvInitialized.current) return;
    try {
      await command("sub-add", [path, "select"]);
    } catch (err) {
      console.error("Load subtitle failed:", err);
    }
  }, []);

  const playlistNext = useCallback(async () => {
    const store = usePlayerStore.getState();
    const nextIndex = store.playlistIndex + 1;
    if (nextIndex < store.playlist.length) {
      const nextItem = store.playlist[nextIndex];
      await openFile(nextItem.path);
      usePlayerStore.getState().setPlaylistIndex(nextIndex);
    }
  }, [openFile]);

  const playlistPrev = useCallback(async () => {
    const store = usePlayerStore.getState();
    const prevIndex = store.playlistIndex - 1;
    if (prevIndex >= 0) {
      const prevItem = store.playlist[prevIndex];
      await openFile(prevItem.path);
      usePlayerStore.getState().setPlaylistIndex(prevIndex);
    }
  }, [openFile]);

  const reorderPlaylist = useCallback(async (fromIndex: number, toIndex: number) => {
    usePlayerStore.getState().reorderPlaylist(fromIndex, toIndex);
  }, []);

  const removeFromPlaylist = useCallback(async (index: number) => {
    const store = usePlayerStore.getState();
    const newPlaylist = store.playlist.filter((_, i) => i !== index);
    let newIndex = store.playlistIndex;

    if (index < store.playlistIndex) {
      newIndex = store.playlistIndex - 1;
    } else if (index === store.playlistIndex) {
      // Removing currently playing item
      if (newPlaylist.length === 0) {
        await stop();
        newIndex = -1;
      } else if (newIndex >= newPlaylist.length) {
        newIndex = newPlaylist.length - 1;
        await openFile(newPlaylist[newIndex].path);
      } else {
        await openFile(newPlaylist[newIndex].path);
      }
    }

    usePlayerStore.setState({
      playlist: newPlaylist,
      playlistIndex: newIndex,
    });
  }, [openFile, stop]);

  const clearPlaylist = useCallback(async () => {
    await stop();
    usePlayerStore.getState().clearPlaylist();
  }, [stop]);

  const setPlaylistIndex = useCallback((index: number) => {
    usePlayerStore.getState().setPlaylistIndex(index);
  }, []);

  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isPaused = usePlayerStore((s) => s.isPaused);
  const isStopped = usePlayerStore((s) => s.isStopped);
  const isFullscreen = usePlayerStore((s) => s.isFullscreen);
  const isMuted = usePlayerStore((s) => s.isMuted);
  const volume = usePlayerStore((s) => s.volume);
  const speed = usePlayerStore((s) => s.speed);
  const mediaTitle = usePlayerStore((s) => s.mediaTitle);
  const filePath = usePlayerStore((s) => s.filePath);
  const mediaType = usePlayerStore((s) => s.mediaType);
  const trackList = usePlayerStore((s) => s.trackList);
  const playlist = usePlayerStore((s) => s.playlist);
  const playlistIndex = usePlayerStore((s) => s.playlistIndex);

  return {
    isPlaying,
    isPaused,
    isStopped,
    isFullscreen,
    isMuted,
    volume,
    speed,
    mediaTitle,
    filePath,
    mediaType,
    trackList,
    playlist,
    playlistIndex,

    openFile,
    addToPlaylist,
    togglePlay,
    stop,
    seek,
    seekRelative,
    setVolume,
    toggleMute,
    setSpeed,
    setFullscreen,
    nextFrame,
    prevFrame,
    loadScreenshot,
    loadSubtitle,
    playlistNext,
    playlistPrev,
    removeFromPlaylist,
    reorderPlaylist,
    clearPlaylist,
    setPlaylistIndex,
  };
}
