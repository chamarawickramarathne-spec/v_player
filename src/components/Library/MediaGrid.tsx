import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { RecentFile } from "../../types";

interface MediaGridProps {
  onSelectFile: (path: string) => void;
}

export default function MediaGrid({ onSelectFile }: MediaGridProps) {
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentFiles();
  }, []);

  const loadRecentFiles = async () => {
    try {
      const files = (await invoke("get_recent_files")) as RecentFile[];
      setRecentFiles(files);
    } catch (err) {
      console.error("Failed to load recent files:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || !isFinite(seconds)) return "";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diff = now.getTime() - d.getTime();
      const minutes = Math.floor(diff / 60000);
      if (minutes < 1) return "Just now";
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      if (days < 7) return `${days}d ago`;
      return d.toLocaleDateString();
    } catch {
      return "";
    }
  };

  const getMediaColor = (type: string) => {
    switch (type) {
      case "video": return "linear-gradient(135deg, #6366f1, #8b5cf6)";
      case "audio": return "linear-gradient(135deg, #ec4899, #f472b6)";
      case "image": return "linear-gradient(135deg, #22c55e, #4ade80)";
      default: return "linear-gradient(135deg, #6b7280, #9ca3af)";
    }
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case "video": return "M8 5v14l11-7z";
      case "audio": return "M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z";
      case "image": return "M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z";
      default: return "M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6z";
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: "16px" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            border: "3px solid var(--border)",
            borderTopColor: "var(--accent)",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>Loading media...</span>
      </div>
    );
  }

  if (recentFiles.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: "20px",
          animation: "fadeInUp 0.5s ease-out",
        }}
      >
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "var(--bg-tertiary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid var(--border)",
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px" }}>
            No recent media
          </div>
          <div style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.5 }}>
            Open a file with{" "}
            <kbd style={{
              padding: "2px 8px",
              borderRadius: "4px",
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border)",
              fontSize: "11px",
              fontFamily: "monospace",
            }}>Ctrl+O</kbd>{" "}
            to get started
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", overflowY: "auto", height: "100%", animation: "fadeIn 0.3s ease-out" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 4px 0", letterSpacing: "-0.02em" }}>
            Recent Media
          </h2>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
            {recentFiles.length} file{recentFiles.length !== 1 ? "s" : ""} played recently
          </p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "14px",
        }}
      >
        {recentFiles.map((file, index) => (
          <div
            key={file.path}
            onClick={() => onSelectFile(file.path)}
            style={{
              background: "var(--bg-secondary)",
              borderRadius: "var(--radius)",
              padding: "0",
              cursor: "pointer",
              transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
              border: "1px solid var(--border)",
              overflow: "hidden",
              animation: `fadeInUp 0.4s ease-out ${index * 0.03}s both`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "var(--shadow-lg)";
              e.currentTarget.style.borderColor = "var(--accent)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.borderColor = "var(--border)";
            }}
          >
            {/* Media type header */}
            <div
              style={{
                height: "4px",
                background: getMediaColor(file.media_type),
              }}
            />

            <div style={{ padding: "14px 16px" }}>
              {/* Icon + Title */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "12px" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: getMediaColor(file.media_type),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: `0 4px 12px ${file.media_type === "video" ? "rgba(99, 102, 241, 0.3)" : file.media_type === "audio" ? "rgba(236, 72, 153, 0.3)" : "rgba(34, 197, 94, 0.3)"}`,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                    <path d={getMediaIcon(file.media_type)} />
                  </svg>
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      lineHeight: 1.3,
                    }}
                  >
                    {file.name}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                    <span style={{
                      fontSize: "10px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color: "var(--text-muted)",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      background: "var(--bg-tertiary)",
                    }}>
                      {file.media_type}
                    </span>
                  </div>
                </div>
              </div>

              {/* Meta info */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  {formatDate(file.last_played)}
                </span>
                {file.duration > 0 && (
                  <span style={{
                    fontSize: "11px",
                    fontFamily: "'SF Mono', 'Cascadia Code', monospace",
                    color: "var(--text-muted)",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    background: "var(--bg-tertiary)",
                  }}>
                    {formatTime(file.position)} / {formatTime(file.duration)}
                  </span>
                )}
              </div>

              {/* Progress bar */}
              {file.duration > 0 && file.position > 0 && (
                <div
                  style={{
                    marginTop: "10px",
                    height: "3px",
                    background: "var(--progress-bg)",
                    borderRadius: "2px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${(file.position / file.duration) * 100}%`,
                      background: getMediaColor(file.media_type),
                      borderRadius: "2px",
                      transition: "width 0.3s",
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
