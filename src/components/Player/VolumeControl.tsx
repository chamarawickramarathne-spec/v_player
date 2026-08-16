import { useState, useCallback, useRef } from "react";
import { usePlayerStore } from "../../stores/playerStore";

interface VolumeControlProps {
  onSetVolume: (vol: number) => void;
  onToggleMute: () => void;
}

export default function VolumeControl({ onSetVolume, onToggleMute }: VolumeControlProps) {
  const volume = usePlayerStore((s) => s.volume);
  const isMuted = usePlayerStore((s) => s.isMuted);
  const [showSlider, setShowSlider] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const displayVolume = isMuted ? 0 : volume;

  const getVolumeIcon = () => {
    if (isMuted || displayVolume === 0) return "M16.5 12A4.5 4.5 0 0 0 14 8.18v1.7l2.39 2.4c.07-.49.11-.99.11-1.48zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.89 8.89 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z";
    if (displayVolume < 0.5) return "M7 9v6h4l5 5V4l-5 5H7zm9.5 3A4.5 4.5 0 0 0 14 8.18v1.7l2.39 2.4c.07-.49.11-.99.11-1.48zM14 12.18v1.84l2.38 2.38c.08-.46.12-.93.12-1.42 0-.49-.04-.96-.12-1.42L14 12.18z";
    return "M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8.18v7.64a4.47 4.47 0 0 0 2.5-3.82zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z";
  };

  const handleMouseEnter = useCallback(() => setShowSlider(true), []);
  const handleMouseLeave = useCallback(() => setShowSlider(false), []);

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "2px",
        position: "relative",
      }}
    >
      <button
        onClick={onToggleMute}
        title={isMuted ? "Unmute (M)" : "Mute (M)"}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          color: isMuted ? "#ef4444" : "var(--text-secondary)",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--bg-hover)";
          e.currentTarget.style.color = "var(--text-primary)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = isMuted ? "#ef4444" : "var(--text-secondary)";
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d={getVolumeIcon()} />
        </svg>
      </button>

      <div
        style={{
          width: showSlider ? "100px" : "0px",
          opacity: showSlider ? 1 : 0,
          overflow: "hidden",
          transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          display: "flex",
          alignItems: "center",
          paddingLeft: showSlider ? "4px" : "0px",
        }}
      >
        <div style={{ position: "relative", width: "100%", height: "20px", display: "flex", alignItems: "center" }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: "50%",
              transform: "translateY(-50%)",
              width: `${displayVolume * 100}%`,
              height: "3px",
              background: "var(--accent)",
              borderRadius: "2px",
              pointerEvents: "none",
            }}
          />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={displayVolume}
            onChange={(e) => onSetVolume(parseFloat(e.target.value))}
            style={{
              width: "100%",
              height: "20px",
              position: "relative",
              zIndex: 1,
            }}
          />
        </div>
      </div>

      {showSlider && (
        <div
          style={{
            fontSize: "11px",
            fontFamily: "'SF Mono', 'Cascadia Code', monospace",
            color: "var(--text-muted)",
            minWidth: "32px",
            textAlign: "right",
            animation: "fadeIn 0.15s ease-out",
          }}
        >
          {Math.round(displayVolume * 100)}
        </div>
      )}
    </div>
  );
}
