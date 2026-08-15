import { useRef, useEffect, useState } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { usePlayerStore } from "../../stores/playerStore";

interface VideoSurfaceProps {
  onFileDrop?: (paths: string[]) => void;
  onClick?: () => void;
  onDoubleClick?: () => void;
}

export default function VideoSurface({ onFileDrop, onClick, onDoubleClick }: VideoSurfaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const { filePath, mediaType, isPlaying, isStopped, currentTime, duration, mediaTitle } = usePlayerStore();

  useEffect(() => {
    let unlisten: (() => void) | null = null;

    const setupDragDrop = async () => {
      try {
        const appWindow = getCurrentWebviewWindow();
        unlisten = await appWindow.onDragDropEvent((event) => {
          if (event.payload.type === "over") {
            setIsDragOver(true);
          } else if (event.payload.type === "drop") {
            setIsDragOver(false);
            const paths = event.payload.paths;
            if (paths && paths.length > 0) {
              onFileDrop?.(paths);
            }
          } else {
            // "leave" - drag cancelled
            setIsDragOver(false);
          }
        });
      } catch (err) {
        console.error("Failed to set up drag-drop listener:", err);
      }
    };

    setupDragDrop();

    return () => {
      if (unlisten) unlisten();
    };
  }, [onFileDrop]);

  const handleClick = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples((prev) => [...prev, { x, y, id }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 600);
    onClick?.();
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      ref={containerRef}
      className="video-surface"
      onClick={handleClick}
      onDoubleClick={onDoubleClick}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        background: !isStopped && filePath && mediaType === "video" ? "transparent" : "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        cursor: "pointer",
      }}
    >
      {/* Drag overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: isDragOver
            ? "rgba(99, 102, 241, 0.15)"
            : "transparent",
          border: isDragOver ? "3px dashed var(--accent)" : "3px dashed transparent",
          borderRadius: isDragOver ? "0" : "0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "16px",
          zIndex: 50,
          transition: "all 0.3s ease",
          pointerEvents: isDragOver ? "auto" : "none",
          backdropFilter: isDragOver ? "blur(8px)" : "none",
        }}
      >
        {isDragOver && (
          <>
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: "var(--accent-gradient)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation: "breathe 1.5s ease-in-out infinite",
                boxShadow: "var(--shadow-glow)",
              }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="white">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
            </div>
            <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--accent)" }}>
              Drop to play
            </span>
          </>
        )}
      </div>

      {/* Click ripples */}
      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          style={{
            position: "absolute",
            left: ripple.x - 30,
            top: ripple.y - 30,
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.2)",
            animation: "fadeInScale 0.6s ease-out forwards",
            pointerEvents: "none",
            zIndex: 60,
          }}
        />
      ))}

      {/* Empty state */}
      {!filePath && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "28px",
            color: "var(--text-muted)",
            animation: "fadeInUp 0.6s ease-out",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100px",
              height: "100px",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background: "var(--accent-gradient)",
                opacity: 0.1,
                animation: "breathe 3s ease-in-out infinite",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: "8px",
                borderRadius: "50%",
                background: "var(--accent-dim)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid var(--border)",
              }}
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="5 3 19 12 5 21 5 3" fill="var(--accent)" opacity="0.3" />
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
          </div>

          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px", color: "var(--text-primary)" }}>
              Drop media to play
            </div>
            <div style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.5 }}>
              Press <kbd style={{
                padding: "2px 8px",
                borderRadius: "4px",
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border)",
                fontSize: "12px",
                fontFamily: "monospace",
              }}>Ctrl+O</kbd> to browse files
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            {["Video", "Audio", "Image"].map((type, i) => (
              <div
                key={type}
                style={{
                  padding: "6px 14px",
                  borderRadius: "20px",
                  background: "var(--bg-tertiary)",
                  border: "1px solid var(--border)",
                  fontSize: "12px",
                  color: "var(--text-secondary)",
                  animation: `fadeInUp 0.4s ease-out ${i * 0.1}s both`,
                }}
              >
                {type === "Video" && "🎬 "}
                {type === "Audio" && "🎵 "}
                {type === "Image" && "🖼️ "}
                {type}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image display */}
      {filePath && mediaType === "image" && (
        <img
          src={`https://asset.localhost/${encodeURIComponent(filePath)}`}
          alt={mediaTitle}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
            animation: "fadeInScale 0.4s ease-out",
          }}
        />
      )}

      {/* Audio visualization */}
      {filePath && mediaType === "audio" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "24px",
            color: "var(--text-primary)",
            animation: "fadeInUp 0.5s ease-out",
          }}
        >
          <div
            style={{
              width: "140px",
              height: "140px",
              borderRadius: "50%",
              background: "var(--accent-gradient)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "var(--shadow-glow)",
              animation: isPlaying ? "breathe 2s ease-in-out infinite" : "none",
            }}
          >
            <svg
              width="60"
              height="60"
              viewBox="0 0 24 24"
              fill="white"
              style={{
                animation: isPlaying ? "float 3s ease-in-out infinite" : "none",
              }}
            >
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>

          <div style={{ textAlign: "center", maxWidth: "350px" }}>
            <div
              style={{
                fontSize: "18px",
                fontWeight: 700,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                marginBottom: "6px",
              }}
            >
              {mediaTitle}
            </div>
            {duration > 0 && (
              <div style={{ fontSize: "13px", color: "var(--text-muted)", fontFamily: "monospace" }}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            )}
          </div>

          {/* Audio visualizer bars */}
          {isPlaying && (
            <div style={{ display: "flex", gap: "3px", alignItems: "end", height: "30px" }}>
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: "3px",
                    borderRadius: "2px",
                    background: "var(--accent)",
                    animation: `pulse ${0.5 + Math.random() * 0.5}s ease-in-out infinite ${i * 0.05}s`,
                    height: `${8 + Math.random() * 22}px`,
                    opacity: 0.7,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Video timer overlay */}
      {filePath && mediaType === "video" && isPlaying && (
        <div
          style={{
            position: "absolute",
            bottom: "80px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(12px)",
            padding: "6px 16px",
            borderRadius: "20px",
            fontSize: "13px",
            fontFamily: "monospace",
            pointerEvents: "none",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            animation: "fadeIn 0.3s ease-out",
            letterSpacing: "0.5px",
          }}
        >
          <span style={{ color: "var(--text-primary)" }}>{formatTime(currentTime)}</span>
          <span style={{ color: "var(--text-muted)", margin: "0 6px" }}>/</span>
          <span style={{ color: "var(--text-secondary)" }}>{formatTime(duration)}</span>
        </div>
      )}
    </div>
  );
}
