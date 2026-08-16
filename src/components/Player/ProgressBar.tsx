import { useRef, useState, useCallback } from "react";
import { usePlayerStore } from "../../stores/playerStore";

interface ProgressBarProps {
  onSeek: (position: number) => void;
}

export default function ProgressBar({ onSeek }: ProgressBarProps) {
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const barRef = useRef<HTMLDivElement>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getTimeFromEvent = useCallback(
    (e: React.MouseEvent) => {
      if (!barRef.current || duration <= 0) return 0;
      const rect = barRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      return (x / rect.width) * duration;
    },
    [duration],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!barRef.current) return;
      const rect = barRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      setHoverX(x);
      setHoverTime(getTimeFromEvent(e));

      if (isDragging) {
        const time = getTimeFromEvent(e);
        onSeek(time);
      }
    },
    [getTimeFromEvent, isDragging, onSeek],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      const time = getTimeFromEvent(e);
      onSeek(time);

      const handleUp = () => {
        setIsDragging(false);
        window.removeEventListener("mouseup", handleUp);
      };
      window.addEventListener("mouseup", handleUp);
    },
    [getTimeFromEvent, onSeek],
  );

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: isHovered || isDragging ? "24px" : "18px",
        display: "flex",
        alignItems: "center",
        cursor: "pointer",
        padding: "0 2px",
        transition: "height 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <div
        ref={barRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setHoverTime(null);
        }}
        style={{
          position: "relative",
          width: "100%",
          height: isHovered || isDragging ? "8px" : "5px",
          background: "var(--progress-bg)",
          borderRadius: "4px",
          cursor: "pointer",
          transition: "height 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          overflow: "visible",
          border: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        {/* Buffered/progress fill */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: `${progress}%`,
            background: "var(--accent-gradient)",
            borderRadius: "4px",
            pointerEvents: "none",
            transition: isDragging ? "none" : "width 0.1s linear",
            boxShadow: isHovered || isDragging ? "0 0 12px var(--accent-glow)" : "none",
          }}
        />

        {/* Hover preview line */}
        {hoverTime !== null && !isDragging && (
          <div
            style={{
              position: "absolute",
              left: `${(hoverTime / duration) * 100}%`,
              top: "0",
              height: "100%",
              width: "2px",
              background: "rgba(255, 255, 255, 0.4)",
              borderRadius: "1px",
              pointerEvents: "none",
              transform: "translateX(-50%)",
            }}
          />
        )}

        {/* Thumb */}
        <div
          style={{
            position: "absolute",
            left: `${progress}%`,
            top: "50%",
            transform: `translate(-50%, -50%) scale(${isHovered || isDragging ? 1 : 0})`,
            width: "16px",
            height: "16px",
            background: "white",
            borderRadius: "50%",
            pointerEvents: "none",
            transition: "transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
            boxShadow: "0 0 8px rgba(0, 0, 0, 0.3), 0 0 20px var(--accent-glow)",
          }}
        />
      </div>

      {/* Hover time tooltip */}
      {hoverTime !== null && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            left: `${hoverX}px`,
            transform: "translateX(-50%)",
            marginBottom: "8px",
            background: "var(--controls-bg-solid)",
            backdropFilter: "none",
            color: "var(--text-primary)",
            padding: "5px 10px",
            borderRadius: "8px",
            fontSize: "12px",
            fontFamily: "monospace",
            pointerEvents: "none",
            whiteSpace: "nowrap",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-md)",
            animation: "fadeIn 0.15s ease-out",
            letterSpacing: "0.5px",
          }}
        >
          {formatTime(hoverTime)}
        </div>
      )}
    </div>
  );
}
