import { useState, useCallback } from "react";
import type { PlaylistItem } from "../../types";

interface PlaylistPanelProps {
  visible: boolean;
  playlist: PlaylistItem[];
  currentIndex: number;
  onSelectItem: (index: number) => void;
  onRemoveItem: (index: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onClear: () => void;
  onAddFiles: () => void;
}

export default function PlaylistPanel({
  visible,
  playlist,
  currentIndex,
  onSelectItem,
  onRemoveItem,
  onReorder,
  onClear,
  onAddFiles,
}: PlaylistPanelProps) {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, toIndex: number) => {
      e.preventDefault();
      const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
      if (!isNaN(fromIndex) && fromIndex !== toIndex) {
        onReorder(fromIndex, toIndex);
      }
      setDragOverIndex(null);
      setDraggedIndex(null);
    },
    [onReorder],
  );

  const handleDragEnd = useCallback(() => {
    setDragOverIndex(null);
    setDraggedIndex(null);
  }, []);

  if (!visible) return null;

  const getMediaColor = (type: string) => {
    switch (type) {
      case "video": return "#6366f1";
      case "audio": return "#ec4899";
      case "image": return "#22c55e";
      default: return "#6b7280";
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: "320px",
        height: "100%",
        background: "rgba(12, 12, 18, 0.95)",
        backdropFilter: "blur(20px)",
        borderLeft: "1px solid rgba(255, 255, 255, 0.06)",
        display: "flex",
        flexDirection: "column",
        zIndex: 200,
        animation: "slideInRight 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        transition: "border 0.2s",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--accent)">
            <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
          </svg>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
            Playlist
          </span>
          <span style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            background: "rgba(255, 255, 255, 0.06)",
            padding: "2px 8px",
            borderRadius: "10px",
          }}>
            {playlist.length}
          </span>
        </div>
        {playlist.length > 0 && (
          <button
            onClick={onClear}
            style={{
              padding: "5px 10px",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: 500,
              color: "var(--text-muted)",
              transition: "all 0.2s",
              border: "1px solid transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
              e.currentTarget.style.color = "#ef4444";
              e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--text-muted)";
              e.currentTarget.style.borderColor = "transparent";
            }}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: playlist.length === 0 ? "0" : "4px 0" }}>
        {playlist.length === 0 ? (
          /* Empty state */
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: "16px",
              padding: "24px",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "16px",
                background: "rgba(99, 102, 241, 0.1)",
                border: "1px dashed rgba(99, 102, 241, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                No files in playlist
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Open files to start building your playlist
              </div>
            </div>
            <button
              onClick={onAddFiles}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 18px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                color: "white",
                background: "var(--accent)",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s",
                boxShadow: "0 2px 12px var(--accent-glow)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--accent-hover)";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 4px 16px var(--accent-glow)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--accent)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 12px var(--accent-glow)";
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z" />
              </svg>
              Add Files
            </button>
          </div>
        ) : (
          /* Playlist items */
          playlist.map((item, index) => {
            const isActive = index === currentIndex;
            const mediaColor = getMediaColor(item.mediaType);
            const isDragOver = dragOverIndex === index;
            const isDragging = draggedIndex === index;

            return (
              <div
                key={`${item.path}-${index}`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                onClick={() => onSelectItem(index)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 16px",
                  cursor: "grab",
                  background: isActive
                    ? "rgba(99, 102, 241, 0.1)"
                    : isDragOver
                    ? "rgba(99, 102, 241, 0.06)"
                    : "transparent",
                  borderLeft: isActive
                    ? "3px solid var(--accent)"
                    : "3px solid transparent",
                  borderTop: isDragOver ? "2px solid var(--accent)" : "2px solid transparent",
                  opacity: isDragging ? 0.4 : 1,
                  transition: "background 0.15s, opacity 0.15s, border 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive && !isDragOver) e.currentTarget.style.background = "transparent";
                }}
              >
                {/* Drag handle */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "14px",
                    flexShrink: 0,
                    opacity: 0.3,
                    cursor: "grab",
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="8" cy="4" r="2" />
                    <circle cx="16" cy="4" r="2" />
                    <circle cx="8" cy="12" r="2" />
                    <circle cx="16" cy="12" r="2" />
                    <circle cx="8" cy="20" r="2" />
                    <circle cx="16" cy="20" r="2" />
                  </svg>
                </div>

                {/* Number / playing indicator */}
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "7px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: isActive ? "white" : "var(--text-muted)",
                    background: isActive ? mediaColor : "rgba(255, 255, 255, 0.05)",
                    flexShrink: 0,
                  }}
                >
                  {isActive ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                      <polygon points="8 5 19 12 8 19 8 5" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: isActive ? 600 : 400,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                    }}
                  >
                    {item.name}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "2px" }}>
                    <div
                      style={{
                        width: "5px",
                        height: "5px",
                        borderRadius: "50%",
                        background: mediaColor,
                      }}
                    />
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "capitalize" }}>
                      {item.mediaType}
                    </span>
                  </div>
                </div>

                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveItem(index);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "24px",
                    height: "24px",
                    borderRadius: "6px",
                    opacity: 0,
                    transition: "all 0.15s",
                    color: "var(--text-muted)",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "1";
                    e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                    e.currentTarget.style.color = "#ef4444";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "0";
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--text-muted)";
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer: Add more files */}
      {playlist.length > 0 && (
        <div
          style={{
            padding: "10px 16px",
            borderTop: "1px solid rgba(255, 255, 255, 0.06)",
            flexShrink: 0,
          }}
        >
          <button
            onClick={onAddFiles}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              width: "100%",
              padding: "8px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 500,
              color: "var(--text-secondary)",
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px dashed rgba(255, 255, 255, 0.1)",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(99, 102, 241, 0.1)";
              e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.3)";
              e.currentTarget.style.color = "var(--accent)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
            Add more files
          </button>
        </div>
      )}
    </div>
  );
}
