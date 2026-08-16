import { useEffect, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
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
import {
  getMediaType,
  isPlayableSource,
  isUrl,
  sourceKey,
  displayName,
} from "../lib/media";
import type { PlaylistItem, PlayerState, RepeatMode } from "../types";

const TIME_POS_MIN_MS = 100;
const POSITION_SAVE_MS = 10000;
const RESUME_END_MARGIN = 5;

const OBSERVED_PROPERTIES = [
  ["pause", "flag"],
  ["time-pos", "double", "none"],
  ["duration", "double", "none"],
  ["media-title", "string", "none"],
  ["filename", "string", "none"],
  ["volume", "double"],
  ["mute", "flag"],
  ["speed", "double"],
  ["track-list", "node"],
] as const;

function buildShuffleOrder(length: number, currentIndex: number): number[] {
  const rest = Array.from({ length }, (_, i) => i).filter((i) => i !== currentIndex);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  if (currentIndex >= 0 && currentIndex < length) {
    return [currentIndex, ...rest];
  }
  return rest;
}

function resolveNextIndex(store: PlayerState, direction: 1 | -1): number {
  const { playlist, playlistIndex, repeatMode, isShuffled, shuffleOrder } = store;
  if (playlist.length === 0) return -1;

  if (isShuffled && shuffleOrder && shuffleOrder.length > 0) {
    const pos = shuffleOrder.indexOf(playlistIndex);
    const start = pos >= 0 ? pos : 0;
    const nextPos = start + direction;
    if (nextPos >= 0 && nextPos < shuffleOrder.length) {
      return shuffleOrder[nextPos];
    }
    if (repeatMode === "all") {
      return direction === 1 ? shuffleOrder[0] : shuffleOrder[shuffleOrder.length - 1];
    }
    return -1;
  }

  const next = playlistIndex + direction;
  if (next >= 0 && next < playlist.length) return next;
  if (repeatMode === "all" && playlist.length > 0) {
    return direction === 1 ? 0 : playlist.length - 1;
  }
  return -1;
}

async function savePlaybackPosition() {
  const store = usePlayerStore.getState();
  const { filePath, currentTime, duration, mediaType } = store;
  if (!filePath || isUrl(filePath)) return;
  if (mediaType === "image") return;
  if (!duration || duration <= 0 || !isFinite(currentTime)) return;

  let position = currentTime;
  if (position >= duration - RESUME_END_MARGIN) {
    position = 0;
  }

  try {
    await invoke("update_position", {
      path: filePath,
      position,
      duration,
    });
  } catch (err) {
    console.error("Failed to save position:", err);
  }
}

async function addRecent(filePath: string, mediaType: string) {
  if (isUrl(filePath)) return;
  try {
    await invoke("add_recent_file", {
      path: filePath,
      name: displayName(filePath),
      mediaType,
    });
  } catch (err) {
    console.error("Failed to add recent file:", err);
  }
}

async function clearAbLoopMpv() {
  try {
    await setProperty("ab-loop-a", "no");
    await setProperty("ab-loop-b", "no");
  } catch {
    /* ignore */
  }
  usePlayerStore.getState().clearAbLoop();
}

export function useMpv() {
  const mpvInitialized = useRef(false);
  const openFileRef = useRef<(path: string, startAt?: number) => Promise<void>>(async () => {});

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
        "network-timeout": "60",
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

        listenEvents((event: MpvEvent) => {
          if (event.event === "end-file") {
            const reason = (event as any).reason;
            if (reason === "eof") {
              const store = usePlayerStore.getState();
              void savePlaybackPosition();

              if (store.repeatMode === "one") {
                return;
              }

              const nextIndex = resolveNextIndex(store, 1);
              if (nextIndex >= 0) {
                const nextItem = store.playlist[nextIndex];
                void openFileRef.current(nextItem.path).then(() => {
                  usePlayerStore.getState().setPlaylistIndex(nextIndex);
                });
              } else {
                store.setStopped(true);
              }
            }
          }
        });

        command("set", ["volume", Math.round(settings.volume * 100)]).catch(console.error);
      })
      .catch((err) => {
        console.error("Failed to initialize mpv:", err);
      });

    const posInterval = window.setInterval(() => {
      if (usePlayerStore.getState().isPlaying) {
        void savePlaybackPosition();
      }
    }, POSITION_SAVE_MS);

    let cancelled = false;
    let unlistenClose: (() => void) | undefined;
    const win = getCurrentWindow();
    win
      .onCloseRequested(async (event) => {
        // Take ownership of close so a hung IPC save cannot leave the window open.
        event.preventDefault();
        try {
          await Promise.race([
            savePlaybackPosition(),
            new Promise<void>((resolve) => {
              window.setTimeout(resolve, 400);
            }),
          ]);
        } catch {
          /* ignore */
        }
        try {
          await win.destroy();
        } catch (err) {
          console.error("Failed to destroy window:", err);
        }
      })
      .then((fn) => {
        if (cancelled) fn();
        else unlistenClose = fn;
      })
      .catch(console.error);

    return () => {
      cancelled = true;
      window.clearInterval(posInterval);
      unlistenClose?.();
      if (mpvInitialized.current) {
        void savePlaybackPosition();
        destroy().catch(console.error);
        mpvInitialized.current = false;
      }
    };
  }, []);

  const openFile = useCallback(async (filePath: string, startAt?: number) => {
    if (!mpvInitialized.current) return;
    try {
      await savePlaybackPosition();
      await clearAbLoopMpv();

      await command("loadfile", [filePath, "replace"]);
      const mediaType = getMediaType(filePath);
      const store = usePlayerStore.getState();
      store.setFilePath(filePath);
      store.setMediaType(mediaType);
      store.setPlaying(true);
      store.setCurrentTime(0);

      await addRecent(filePath, mediaType);

      if (startAt && startAt > 0 && isFinite(startAt)) {
        const seekTo = startAt;
        window.setTimeout(() => {
          command("seek", [seekTo, "absolute"])
            .then(() => usePlayerStore.getState().setCurrentTime(seekTo))
            .catch(console.error);
        }, 250);
      }
    } catch (err) {
      console.error("Failed to open file:", err);
    }
  }, []);

  openFileRef.current = openFile;

  const addToPlaylist = useCallback(async (paths: string[]): Promise<string | null> => {
    const store = usePlayerStore.getState();
    const existing = new Set(store.playlist.map((item) => sourceKey(item.path)));
    const newItems: PlaylistItem[] = [];

    for (const path of paths) {
      const trimmed = path.trim();
      if (!isPlayableSource(trimmed)) continue;
      const key = sourceKey(trimmed);
      if (existing.has(key)) continue;
      existing.add(key);
      newItems.push({
        path: trimmed,
        name: displayName(trimmed),
        mediaType: getMediaType(trimmed),
      });
    }

    if (newItems.length === 0) return null;

    const wasEmpty = store.playlist.length === 0;
    usePlayerStore.setState({
      playlist: [...store.playlist, ...newItems],
      ...(wasEmpty ? { playlistIndex: 0 } : {}),
      ...(store.isShuffled
        ? {
            isShuffled: false,
            shuffleOrder: null,
          }
        : {}),
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
      await savePlaybackPosition();
      await clearAbLoopMpv();
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

  const setTrack = useCallback(async (type: string, id: number) => {
    if (!mpvInitialized.current) return;
    const prop = type === "video" ? "vid" : type === "audio" ? "aid" : "sid";
    try {
      await setProperty(prop, id < 0 ? "no" : id);
    } catch (err) {
      console.error("Set track failed:", err);
    }
  }, []);

  const cycleRepeat = useCallback(async () => {
    const store = usePlayerStore.getState();
    const order: RepeatMode[] = ["off", "one", "all"];
    const next = order[(order.indexOf(store.repeatMode) + 1) % order.length];
    store.setRepeatMode(next);
    if (!mpvInitialized.current) return;
    try {
      await setProperty("loop-file", next === "one" ? "inf" : "no");
    } catch (err) {
      console.error("Set loop-file failed:", err);
    }
  }, []);

  const toggleShuffle = useCallback(() => {
    const store = usePlayerStore.getState();
    if (store.isShuffled) {
      store.setShuffled(false, null);
      return;
    }
    if (store.playlist.length < 2) return;
    const order = buildShuffleOrder(store.playlist.length, store.playlistIndex);
    store.setShuffled(true, order);
  }, []);

  const cycleAbLoop = useCallback(async () => {
    if (!mpvInitialized.current) return;
    const store = usePlayerStore.getState();
    const t = store.currentTime;

    try {
      if (store.abLoopA === null) {
        await setProperty("ab-loop-a", t);
        store.setAbLoopA(t);
      } else if (store.abLoopB === null) {
        const b = Math.max(t, store.abLoopA + 0.1);
        await setProperty("ab-loop-b", b);
        store.setAbLoopB(b);
      } else {
        await clearAbLoopMpv();
      }
    } catch (err) {
      console.error("A-B loop failed:", err);
    }
  }, []);

  const playlistNext = useCallback(async () => {
    const store = usePlayerStore.getState();
    const nextIndex = resolveNextIndex(store, 1);
    if (nextIndex >= 0) {
      const nextItem = store.playlist[nextIndex];
      await openFile(nextItem.path);
      usePlayerStore.getState().setPlaylistIndex(nextIndex);
    }
  }, [openFile]);

  const playlistPrev = useCallback(async () => {
    const store = usePlayerStore.getState();
    const prevIndex = resolveNextIndex(store, -1);
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
      isShuffled: false,
      shuffleOrder: null,
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
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const isShuffled = usePlayerStore((s) => s.isShuffled);
  const abLoopA = usePlayerStore((s) => s.abLoopA);
  const abLoopB = usePlayerStore((s) => s.abLoopB);

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
    repeatMode,
    isShuffled,
    abLoopA,
    abLoopB,

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
    setTrack,
    cycleRepeat,
    toggleShuffle,
    cycleAbLoop,
    playlistNext,
    playlistPrev,
    removeFromPlaylist,
    reorderPlaylist,
    clearPlaylist,
    setPlaylistIndex,
    savePlaybackPosition,
  };
}
