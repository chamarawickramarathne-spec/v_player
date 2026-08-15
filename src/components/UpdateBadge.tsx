import { useEffect } from "react";
import { useUpdaterStore, formatBytes } from "../stores/updaterStore";

export default function UpdateBadge() {
  const appVersion = useUpdaterStore((s) => s.appVersion);
  const checking = useUpdaterStore((s) => s.checking);
  const updateInfo = useUpdaterStore((s) => s.updateInfo);
  const downloading = useUpdaterStore((s) => s.downloading);
  const downloadStage = useUpdaterStore((s) => s.downloadStage);
  const received = useUpdaterStore((s) => s.received);
  const total = useUpdaterStore((s) => s.total);
  const downloadedPath = useUpdaterStore((s) => s.downloadedPath);
  const feedback = useUpdaterStore((s) => s.feedback);
  const oneClickUpdate = useUpdaterStore((s) => s.oneClickUpdate);
  const clearFeedback = useUpdaterStore((s) => s.clearFeedback);

  const hasUpdate = !!updateInfo?.has_update;
  const readyToInstall = downloadStage === "complete" && !!downloadedPath;
  const percent = total > 0 ? Math.min(100, Math.round((received / total) * 100)) : 0;

  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(clearFeedback, 3000);
    return () => clearTimeout(t);
  }, [feedback, clearFeedback]);

  const handleClick = () => {
    if (downloading || checking) return;
    oneClickUpdate();
  };

  const label = checking
    ? "Checking…"
    : downloading
      ? `Downloading ${percent}%`
      : readyToInstall
        ? "Install & Restart"
        : hasUpdate
          ? `Download v${updateInfo?.latest_version}`
          : "Update";

  const isActive = hasUpdate || readyToInstall;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" } as React.CSSProperties}>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 500,
            color: "var(--text-muted)",
            padding: "3px 8px",
            borderRadius: "6px",
            background: "var(--bg-glass)",
            border: "1px solid var(--border)",
            lineHeight: 1,
          }}
        >
          v{appVersion}
        </span>
        <button
          onClick={handleClick}
          disabled={downloading || checking}
          title={
            checking
              ? "Checking for updates..."
              : downloading
                ? `Downloading ${formatBytes(received)} / ${formatBytes(total)}`
                : readyToInstall
                  ? "Install the downloaded update and restart"
                  : hasUpdate
                    ? `Update available: v${updateInfo?.latest_version}`
                    : "Check for updates"
          }
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "5px 11px",
            borderRadius: "6px",
            fontSize: "11px",
            fontWeight: 600,
            lineHeight: 1,
            cursor: downloading || checking ? "default" : "pointer",
            opacity: downloading ? 1 : 1,
            color: isActive ? "var(--accent)" : "var(--text-secondary)",
            background: isActive ? "var(--accent-dim)" : "var(--bg-glass)",
            border: isActive ? "1px solid var(--accent)" : "1px solid var(--border)",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            if (downloading || checking) return;
            e.currentTarget.style.background = isActive ? "var(--accent)" : "var(--bg-hover)";
            e.currentTarget.style.color = isActive ? "#fff" : "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = isActive ? "var(--accent-dim)" : "var(--bg-glass)";
            e.currentTarget.style.color = isActive ? "var(--accent)" : "var(--text-secondary)";
          }}
        >
          {downloading ? (
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                border: "2px solid var(--border-hover)",
                borderTopColor: "var(--accent)",
                animation: "spin 0.8s linear infinite",
                flexShrink: 0,
              }}
            />
          ) : (
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: isActive ? "currentColor" : "transparent",
                border: isActive ? "none" : "1px solid var(--text-muted)",
                flexShrink: 0,
                animation: isActive ? "pulse 2.5s ease-in-out infinite" : "none",
              }}
            />
          )}
          {label}
        </button>
      </div>

      {feedback && (
        <div
          style={{
            position: "fixed",
            top: "50px",
            left: "14px",
            zIndex: 500,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 14px",
            borderRadius: "10px",
            fontSize: "12px",
            fontWeight: 500,
            background: "var(--bg-secondary)",
            border: `1px solid ${
              feedback.type === "error"
                ? "#ef4444"
                : feedback.type === "upToDate" || feedback.type === "downloaded"
                  ? "var(--accent)"
                  : "var(--border)"
            }`,
            color:
              feedback.type === "error" ? "#ef4444" : feedback.type === "upToDate" ? "var(--accent)" : "var(--text-primary)",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.35)",
            backdropFilter: "blur(12px)",
            animation: "fadeSlideIn 0.25s ease",
          } as React.CSSProperties}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background:
                feedback.type === "error"
                  ? "#ef4444"
                  : feedback.type === "checking"
                    ? "var(--accent)"
                    : "currentColor",
              boxShadow: feedback.type === "error" ? "0 0 8px #ef4444" : "0 0 8px var(--accent-glow)",
              flexShrink: 0,
              animation: feedback.type === "checking" ? "pulse 1s ease-in-out infinite" : "none",
            }}
          />
          {feedback.message}
        </div>
      )}
    </>
  );
}
