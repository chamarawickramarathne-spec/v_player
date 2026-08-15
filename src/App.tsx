import { useState, useCallback, useEffect, useRef } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { usePlayerStore } from "./stores/playerStore";
import { useSettingsStore } from "./stores/settingsStore";
import { useUpdaterStore } from "./stores/updaterStore";
import { useMpv } from "./hooks/useMpv";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import VideoSurface from "./components/Player/VideoSurface";
import Controls from "./components/Player/Controls";
import PlaylistPanel from "./components/Player/PlaylistPanel";
import SubtitleSelector from "./components/Player/SubtitleSelector";
import SettingsPanel from "./components/Settings/SettingsPanel";
import UpdateBadge from "./components/UpdateBadge";

type SettingsTab = "general" | "playback" | "about";

export default function App() {
  const player = useMpv();
  const { settings, settingsOpen, setSettingsOpen, loadSettings } = useSettingsStore();
  const checkForUpdates = useUpdaterStore((s) => s.checkForUpdates);
  const loadAppVersion = useUpdaterStore((s) => s.loadAppVersion);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("general");
  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFullscreen = usePlayerStore((s) => s.isFullscreen);

  // Load persisted settings + silent update check on startup
  useEffect(() => {
    loadSettings();
    loadAppVersion();
    checkForUpdates();
  }, [loadSettings, checkForUpdates, loadAppVersion]);

  // Apply theme & accent
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", settings.theme);
    document.documentElement.style.setProperty("--accent", settings.accent_color);
    // Derive hover from accent (lighten)
    document.documentElement.style.setProperty("--accent-hover", settings.accent_color + "dd");
    document.documentElement.style.setProperty("--accent-glow", settings.accent_color + "40");
    document.documentElement.style.setProperty("--accent-dim", settings.accent_color + "1a");
  }, [settings.theme, settings.accent_color]);

  // Auto-hide controls
  const resetControlsTimer = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    if (player.isPlaying) {
      controlsTimer.current = setTimeout(() => setControlsVisible(false), 3000);
    }
  }, [player.isPlaying]);

  useEffect(() => {
    if (!player.isPlaying) {
      setControlsVisible(true);
      if (controlsTimer.current) clearTimeout(controlsTimer.current);
    }
  }, [player.isPlaying]);

  const handleMouseMove = useCallback(() => {
    resetControlsTimer();
  }, [resetControlsTimer]);

  const handleOpenFile = useCallback(async () => {
    const selected = await open({
      multiple: true,
      filters: [
        {
          name: "Media Files",
          extensions: [
            "mp4", "mkv", "avi", "mov", "wmv", "flv", "webm", "ts", "m2ts", "3gp", "ogv",
            "rm", "rmvb", "vob", "asf", "divx", "f4v", "m4v", "mpg", "mpeg", "3g2", "mts", "mxf", "nsv", "ogm",
            "mp3", "flac", "aac", "ogg", "wav", "wma", "m4a", "opus", "ac3", "dts", "alac", "aiff", "ape",
            "mid", "midi", "ra", "tta", "tak", "dsf", "dff",
            "jpg", "jpeg", "png", "bmp", "gif", "tiff", "tif", "webp", "svg", "ico", "heic", "heif",
            "avif", "jxl", "psd", "tga", "hdr", "exr", "pcx", "pgm", "ppm", "pnm", "sfw",
          ],
        },
        { name: "All Files", extensions: ["*"] },
      ],
    });

    if (selected) {
      const paths = Array.isArray(selected) ? selected : [selected];
      const wasEmpty = await player.addToPlaylist(paths);
      await player.openFile(paths[0]);
      if (wasEmpty) {
        player.setPlaylistIndex(0);
      }
    }
  }, [player]);

  const handleDrop = useCallback(
    async (paths: string[]) => {
      const wasEmpty = await player.addToPlaylist(paths);
      if (wasEmpty) {
        await player.openFile(paths[0]);
      }
    },
    [player],
  );

  const handleToggleFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      player.setFullscreen(false);
    } else {
      await document.documentElement.requestFullscreen();
      player.setFullscreen(true);
    }
  }, [player]);

  const handleSpeedUp = useCallback(() => {
    player.setSpeed(player.speed + 0.25);
  }, [player]);

  const handleSpeedDown = useCallback(() => {
    player.setSpeed(player.speed - 0.25);
  }, [player]);

  const handleSpeedReset = useCallback(() => {
    player.setSpeed(1.0);
  }, [player]);

  useKeyboardShortcuts({
    onPlayPause: player.togglePlay,
    onStop: player.stop,
    onSeekForward: () => player.seekRelative(5),
    onSeekBackward: () => player.seekRelative(-5),
    onSeekForwardLarge: () => player.seekRelative(30),
    onSeekBackwardLarge: () => player.seekRelative(-30),
    onVolumeUp: () => player.setVolume(player.volume + 0.05),
    onVolumeDown: () => player.setVolume(player.volume - 0.05),
    onMute: player.toggleMute,
    onFullscreen: handleToggleFullscreen,
    onOpenFile: handleOpenFile,
    onNextFrame: player.nextFrame,
    onPrevFrame: player.prevFrame,
    onSpeedUp: handleSpeedUp,
    onSpeedDown: handleSpeedDown,
    onSpeedReset: handleSpeedReset,
    onNextTrack: player.playlistNext,
    onPrevTrack: player.playlistPrev,
    onTogglePlaylist: () => setShowPlaylist((v) => !v),
  });

  const handleSelectPlaylistItem = useCallback(
    (index: number) => {
      const item = player.playlist[index];
      if (item) {
        player.openFile(item.path);
        player.setPlaylistIndex(index);
      }
    },
    [player],
  );

  const showTitleBar = !isFullscreen || controlsVisible;
  const isVideoPlaying = !player.isStopped && !!player.filePath && player.mediaType === "video";

  return (
    <div
      onMouseMove={handleMouseMove}
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: isVideoPlaying ? "transparent" : "#000",
        position: "relative",
        overflow: "hidden",
        transition: "background 0.4s ease",
      }}
    >
      {/* Title Bar */}
      {showTitleBar && (
        <div
          data-tauri-drag-region
          style={{
            height: "42px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 14px",
            background: player.filePath
              ? (controlsVisible ? "rgba(0, 0, 0, 0.6)" : "transparent")
              : "var(--bg-secondary)",
            borderBottom: player.filePath ? "none" : "1px solid var(--border)",
            backdropFilter: player.filePath ? "blur(12px)" : "none",
            opacity: controlsVisible ? 1 : 0,
            transition: "opacity 0.3s, background 0.3s",
            position: "relative",
            zIndex: 300,
            flexShrink: 0,
          } as React.CSSProperties}
        >
          {/* Left: Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" } as React.CSSProperties}>
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "7px",
                background: "var(--accent-gradient)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px var(--accent-glow)",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                <polygon points="7 5 20 12 7 19 7 5" />
              </svg>
            </div>
            <span
              style={{
                fontSize: "14px",
                fontWeight: 700,
                background: "var(--accent-gradient)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "-0.02em",
              }}
            >
              V Player
            </span>

            {/* Version + update */}
            <UpdateBadge
              onOpenUpdates={() => {
                setSettingsTab("about");
                setSettingsOpen(true);
              }}
            />
          </div>

          {/* Right: Actions */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
            } as React.CSSProperties}
          >
            {/* Open button */}
            <button
              onClick={handleOpenFile}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 500,
                color: "var(--text-secondary)",
                transition: "all 0.2s",
                border: "1px solid var(--border)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--accent-dim)";
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.color = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z" />
              </svg>
              Open
            </button>

            {/* Playlist toggle */}
            <button
              onClick={() => setShowPlaylist(!showPlaylist)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                color: showPlaylist ? "var(--accent)" : "var(--text-secondary)",
                background: showPlaylist ? "var(--accent-dim)" : "transparent",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-dim)")}
              onMouseLeave={(e) => {
                if (!showPlaylist) e.currentTarget.style.background = "transparent";
              }}
              title="Playlist (L)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
              </svg>
            </button>

            {/* Subtitle selector */}
            <SubtitleSelector tracks={player.trackList} onSetTrack={(type, idx) => {}} />

            {/* Settings */}
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                color: "var(--text-secondary)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bg-hover)";
                e.currentTarget.style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
              title="Settings"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden", minHeight: 0 }}>
        <VideoSurface
          onFileDrop={handleDrop}
          onClick={player.togglePlay}
          onDoubleClick={handleToggleFullscreen}
        />

        {/* Controls overlay */}
        <Controls
          visible={controlsVisible}
          onTogglePlay={player.togglePlay}
          onStop={player.stop}
          onNextTrack={player.playlistNext}
          onPrevTrack={player.playlistPrev}
          onSeek={player.seek}
          onSetVolume={player.setVolume}
          onToggleMute={player.toggleMute}
          onToggleFullscreen={handleToggleFullscreen}
          onOpenFile={handleOpenFile}
          onSpeedUp={handleSpeedUp}
          onSpeedDown={handleSpeedDown}
        />

        {/* Playlist panel */}
        <PlaylistPanel
          visible={showPlaylist}
          playlist={player.playlist}
          currentIndex={player.playlistIndex}
          onSelectItem={handleSelectPlaylistItem}
          onRemoveItem={player.removeFromPlaylist}
          onReorder={player.reorderPlaylist}
          onClear={player.clearPlaylist}
          onAddFiles={async () => {
            const selected = await open({
              multiple: true,
              filters: [
                {
                  name: "Media Files",
                  extensions: [
                    "mp4", "mkv", "avi", "mov", "wmv", "flv", "webm", "ts", "m2ts", "3gp", "ogv",
                    "rm", "rmvb", "vob", "asf", "divx", "f4v", "m4v", "mpg", "mpeg", "3g2", "mts", "mxf", "nsv", "ogm",
                    "mp3", "flac", "aac", "ogg", "wav", "wma", "m4a", "opus", "ac3", "dts", "alac", "aiff", "ape",
                    "mid", "midi", "ra", "tta", "tak", "dsf", "dff",
                    "jpg", "jpeg", "png", "bmp", "gif", "tiff", "tif", "webp", "svg", "ico", "heic", "heif",
                    "avif", "jxl", "psd", "tga", "hdr", "exr", "pcx", "pgm", "ppm", "pnm", "sfw",
                  ],
                },
                { name: "All Files", extensions: ["*"] },
              ],
            });
            if (selected) {
              const paths = Array.isArray(selected) ? selected : [selected];
              const wasEmpty = await player.addToPlaylist(paths);
              if (wasEmpty) {
                await player.openFile(paths[0]);
              }
            }
          }}
        />
      </div>

      {/* Settings dialog */}
      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        activeTab={settingsTab}
        onTabChange={setSettingsTab}
      />
    </div>
  );
}
