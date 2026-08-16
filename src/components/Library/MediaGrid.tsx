import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { RecentFile } from "../../types";
import { localFileUrl, resolveThumbUrl } from "../../lib/thumbnails";
import { cancelThumbGen, generateMissingThumbs } from "../../lib/thumbGen";

interface MediaGridProps {
  onSelectFile: (path: string, resumeAt?: number) => void;
  refreshKey?: number;
}

export default function MediaGrid({ onSelectFile, refreshKey = 0 }: MediaGridProps) {
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});
  const [failedThumbs, setFailedThumbs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadRecentFiles();
  }, [refreshKey]);

  useEffect(() => {
    return () => cancelThumbGen();
  }, []);

  const loadRecentFiles = async () => {
    try {
      const files = (await invoke("get_recent_files")) as RecentFile[];
      setRecentFiles(files);
      setFailedThumbs({});

      const urls: Record<string, string> = {};
      await Promise.all(
        files.map(async (file) => {
          if (file.media_type === "image") {
            const u = localFileUrl(file.path);
            if (u) urls[file.path] = u;
            return;
          }
          if (file.media_type === "video") {
            const u = await resolveThumbUrl(file.path);
            if (u) urls[file.path] = u;
          }
        })
      );
      setThumbUrls(urls);

      const missing = files
        .filter((f) => f.media_type === "video" && !urls[f.path])
        .map((f) => f.path);
      if (missing.length > 0) {
        generateMissingThumbs(missing, async (mediaPath) => {
          const u = await resolveThumbUrl(mediaPath);
          if (u) setThumbUrls((prev) => ({ ...prev, [mediaPath]: u }));
        });
      }
    } catch (err) {
      console.error("Failed to load recent files:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (file: RecentFile) => {
    const canResume =
      file.position > 0 &&
      file.duration > 0 &&
      file.position < file.duration - 5;
    onSelectFile(file.path, canResume ? file.position : undefined);
  };

  const handleRemove = async (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    try {
      const files = (await invoke("remove_recent_file", { path })) as RecentFile[];
      setRecentFiles(files);
      setThumbUrls((prev) => {
        const next = { ...prev };
        delete next[path];
        return next;
      });
    } catch (err) {
      console.error("Failed to remove recent file:", err);
    }
  };

  const handleClear = async () => {
    try {
      await invoke("clear_recent_files");
      setRecentFiles([]);
      setThumbUrls({});
    } catch (err) {
      console.error("Failed to clear recent files:", err);
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
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: "16px",
        padding: "40px",
        textAlign: "center",
      }}>
        <div style={{
          width: 72,
          height: 72,
          borderRadius: 18,
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="var(--text-muted)">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>No recent media</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Open a file with Ctrl+O or drop media here
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", overflow: "auto", padding: "24px 28px 40px" }}>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 20,
      }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>Recent</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            {recentFiles.length} item{recentFiles.length === 1 ? "" : "s"}
          </div>
        </div>
        <button
          onClick={handleClear}
          style={{
            fontSize: 12,
            color: "var(--text-muted)",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "6px 12px",
          }}
        >
          Clear all
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "16px",
        }}
      >
        {recentFiles.map((file, index) => {
          const thumb = !failedThumbs[file.path] ? thumbUrls[file.path] : undefined;
          const progress =
            file.duration > 0 && file.position > 0
              ? Math.min(100, (file.position / file.duration) * 100)
              : 0;

          return (
            <div
              key={file.path}
              onClick={() => handleSelect(file)}
              style={{
                background: "var(--bg-secondary)",
                borderRadius: "var(--radius)",
                padding: "0",
                cursor: "pointer",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                border: "1px solid var(--border)",
                overflow: "hidden",
                animation: `fadeInUp 0.4s ease-out ${index * 0.03}s both`,
                position: "relative",
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
              <button
                onClick={(e) => handleRemove(e, file.path)}
                title="Remove"
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  width: 26,
                  height: 26,
                  borderRadius: 6,
                  background: "rgba(0,0,0,0.55)",
                  color: "#fff",
                  zIndex: 3,
                  fontSize: 14,
                  border: "none",
                  lineHeight: 1,
                }}
              >
                ×
              </button>

              <div
                style={{
                  position: "relative",
                  width: "100%",
                  paddingTop: "56.25%",
                  background: getMediaColor(file.media_type),
                  overflow: "hidden",
                }}
              >
                {thumb ? (
                  <img
                    src={thumb}
                    alt=""
                    onError={() =>
                      setFailedThumbs((prev) => ({ ...prev, [file.path]: true }))
                    }
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="white" style={{ opacity: 0.9 }}>
                      <path d={getMediaIcon(file.media_type)} />
                    </svg>
                  </div>
                )}

                <span
                  style={{
                    position: "absolute",
                    left: 8,
                    bottom: 8,
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.4px",
                    color: "#fff",
                    padding: "2px 6px",
                    borderRadius: 4,
                    background: "rgba(0,0,0,0.55)",
                  }}
                >
                  {file.media_type}
                </span>

                {file.duration > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      right: 8,
                      bottom: 8,
                      fontSize: 11,
                      fontFamily: "'SF Mono', 'Cascadia Code', monospace",
                      color: "#fff",
                      padding: "2px 6px",
                      borderRadius: 4,
                      background: "rgba(0,0,0,0.55)",
                    }}
                  >
                    {formatTime(file.duration)}
                  </span>
                )}

                {progress > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      bottom: 0,
                      height: 3,
                      background: "rgba(0,0,0,0.35)",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${progress}%`,
                        background: "var(--accent)",
                      }}
                    />
                  </div>
                )}
              </div>

              <div style={{ padding: "12px 14px 14px" }}>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    lineHeight: 1.35,
                  }}
                  title={file.name}
                >
                  {file.name}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 6,
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    {formatDate(file.last_played)}
                  </span>
                  {file.duration > 0 && file.position > 0 && (
                    <span
                      style={{
                        fontSize: "11px",
                        fontFamily: "'SF Mono', 'Cascadia Code', monospace",
                        color: "var(--text-muted)",
                        flexShrink: 0,
                      }}
                    >
                      {formatTime(file.position)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
