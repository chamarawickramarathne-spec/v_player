import { usePlayerStore } from "../../stores/playerStore";
import ProgressBar from "./ProgressBar";
import VolumeControl from "./VolumeControl";

interface ControlsProps {
  visible: boolean;
  onTogglePlay: () => void;
  onStop: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  onSeek: (position: number) => void;
  onSetVolume: (vol: number) => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onOpenFile: () => void;
  onSpeedUp: () => void;
  onSpeedDown: () => void;
}

const ControlButton = ({
  children,
  onClick,
  title,
  size = 36,
  isAccent = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  size?: number;
  isAccent?: boolean;
}) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: "50%",
      background: isAccent ? "var(--accent)" : "transparent",
      color: isAccent ? "white" : "var(--text-secondary)",
      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      position: "relative",
      overflow: "hidden",
    }}
    onMouseEnter={(e) => {
      if (isAccent) {
        e.currentTarget.style.background = "var(--accent-hover)";
        e.currentTarget.style.transform = "scale(1.08)";
        e.currentTarget.style.boxShadow = "0 0 20px var(--accent-glow)";
      } else {
        e.currentTarget.style.background = "var(--bg-hover)";
        e.currentTarget.style.color = "var(--text-primary)";
      }
    }}
    onMouseLeave={(e) => {
      if (isAccent) {
        e.currentTarget.style.background = "var(--accent)";
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "none";
      } else {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = "var(--text-secondary)";
      }
    }}
  >
    {children}
  </button>
);

export default function Controls({
  visible,
  onTogglePlay,
  onStop,
  onNextTrack,
  onPrevTrack,
  onSeek,
  onSetVolume,
  onToggleMute,
  onToggleFullscreen,
  onOpenFile,
  onSpeedUp,
  onSpeedDown,
}: ControlsProps) {
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const speed = usePlayerStore((s) => s.speed);
  const filePath = usePlayerStore((s) => s.filePath);
  const mediaTitle = usePlayerStore((s) => s.mediaTitle);
  const isFullscreen = usePlayerStore((s) => s.isFullscreen);

  const formatTime = (seconds: number) => {
    if (!seconds || !isFinite(seconds)) return "0:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        background: "linear-gradient(transparent, rgba(0, 0, 0, 0.4) 30%, rgba(0, 0, 0, 0.85))",
        padding: "50px 20px 16px",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
        pointerEvents: visible ? "auto" : "none",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        zIndex: 100,
      }}
    >
      {/* Title */}
      {filePath && (
        <div
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--text-secondary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginBottom: "4px",
            letterSpacing: "-0.01em",
          }}
        >
          {mediaTitle}
        </div>
      )}

      {/* Progress bar */}
      <ProgressBar onSeek={onSeek} />

      {/* Controls row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "4px",
        }}
      >
        {/* Left: play controls + time */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {/* Stop */}
          <ControlButton onClick={onStop} title="Stop">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </ControlButton>

          {/* Previous track */}
          <ControlButton onClick={onPrevTrack} title="Previous track (P)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </ControlButton>

          {/* Play / Pause */}
          <ControlButton onClick={onTogglePlay} title={isPlaying ? "Pause (Space)" : "Play (Space)"} size={42} isAccent>
            {isPlaying ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <rect x="6" y="4" width="4" height="16" rx="1.5" />
                <rect x="14" y="4" width="4" height="16" rx="1.5" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <polygon points="7 4 20 12 7 20 7 4" />
              </svg>
            )}
          </ControlButton>

          {/* Next track */}
          <ControlButton onClick={onNextTrack} title="Next track (N)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </ControlButton>

          <ControlButton onClick={() => onSeek(Math.max(0, currentTime - 5))} title="Back 5s (←)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
            </svg>
          </ControlButton>

          <ControlButton onClick={() => onSeek(Math.min(duration, currentTime + 5))} title="Forward 5s (→)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.01 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" />
            </svg>
          </ControlButton>

          {/* Time display */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              marginLeft: "10px",
              padding: "4px 12px",
              background: "rgba(255, 255, 255, 0.05)",
              borderRadius: "8px",
              border: "1px solid var(--border)",
            }}
          >
            <span style={{ fontSize: "13px", fontFamily: "'SF Mono', 'Cascadia Code', monospace", color: "var(--text-primary)", fontWeight: 500 }}>
              {formatTime(currentTime)}
            </span>
            <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 300 }}>/</span>
            <span style={{ fontSize: "13px", fontFamily: "'SF Mono', 'Cascadia Code', monospace", color: "var(--text-secondary)" }}>
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Right: speed, volume, fullscreen */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {/* Speed indicator */}
          <button
            onClick={onSpeedDown}
            title="Slower ([)"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "32px",
              padding: "0 8px",
              borderRadius: "8px",
              fontSize: "11px",
              fontFamily: "'SF Mono', 'Cascadia Code', monospace",
              color: "var(--text-muted)",
              transition: "all 0.2s",
              border: "1px solid transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-hover)";
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "transparent";
              e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            {"["}
          </button>

          <div
            style={{
              fontSize: "12px",
              fontFamily: "'SF Mono', 'Cascadia Code', monospace",
              color: speed !== 1 ? "var(--accent)" : "var(--text-secondary)",
              minWidth: "42px",
              textAlign: "center",
              padding: "4px 8px",
              borderRadius: "6px",
              background: speed !== 1 ? "var(--accent-dim)" : "transparent",
              fontWeight: 600,
              letterSpacing: "0.3px",
            }}
          >
            {speed.toFixed(2)}x
          </div>

          <button
            onClick={onSpeedUp}
            title="Faster (])"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "32px",
              padding: "0 8px",
              borderRadius: "8px",
              fontSize: "11px",
              fontFamily: "'SF Mono', 'Cascadia Code', monospace",
              color: "var(--text-muted)",
              transition: "all 0.2s",
              border: "1px solid transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-hover)";
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "transparent";
              e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            {"]"}
          </button>

          <div style={{ width: "1px", height: "24px", background: "var(--border)", margin: "0 6px" }} />

          <VolumeControl onSetVolume={onSetVolume} onToggleMute={onToggleMute} />

          <ControlButton onClick={onToggleFullscreen} title={isFullscreen ? "Exit Fullscreen (F)" : "Fullscreen (F)"}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              {isFullscreen ? (
                <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
              ) : (
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
              )}
            </svg>
          </ControlButton>
        </div>
      </div>
    </div>
  );
}
