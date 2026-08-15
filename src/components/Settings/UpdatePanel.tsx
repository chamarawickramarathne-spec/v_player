import { useEffect } from "react";
import { useUpdaterStore, formatBytes } from "../../stores/updaterStore";

export default function UpdatePanel() {
  const {
    appVersion,
    checking,
    checkedOnce,
    checkError,
    updateInfo,
    downloading,
    downloadStage,
    received,
    total,
    downloadedPath,
    installError,
    loadAppVersion,
    checkForUpdates,
    downloadUpdate,
    installUpdate,
  } = useUpdaterStore();

  useEffect(() => {
    loadAppVersion();
    if (!checkedOnce && !checking) checkForUpdates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const percent = total > 0 ? Math.min(100, Math.round((received / total) * 100)) : 0;
  const readyToInstall = downloadStage === "complete" && !!downloadedPath;
  const isDownloading = downloading && !readyToInstall;

  const buttonBase: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "10px 18px",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: 600,
    transition: "all 0.2s",
  };

  return (
    <div style={{ width: "100%" }}>
      <div style={{ marginBottom: "16px" }}>
        <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "var(--text-primary)" }}>
          Version
        </div>
        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>v{appVersion}</div>
      </div>

      {checking && (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--text-secondary)", fontSize: "13px" }}>
          <div
            style={{
              width: "14px",
              height: "14px",
              borderRadius: "50%",
              border: "2px solid var(--border-hover)",
              borderTopColor: "var(--accent)",
              animation: "spin 0.8s linear infinite",
            }}
          />
          Checking for updates...
        </div>
      )}

      {!checking && checkError && !updateInfo && (
        <div>
          <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "10px" }}>
            Could not check for updates right now.
          </div>
          <button
            onClick={checkForUpdates}
            style={{
              ...buttonBase,
              color: "var(--accent)",
              border: "1px solid var(--accent)",
              background: "var(--accent-dim)",
            }}
          >
            Retry
          </button>
        </div>
      )}

      {!checking && updateInfo && !updateInfo.has_update && (
        <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
          You're up to date with the latest version.
        </div>
      )}

      {!checking && updateInfo && updateInfo.has_update && (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              color: "var(--text-primary)",
              marginBottom: "4px",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "var(--accent)",
                boxShadow: "0 0 8px var(--accent-glow)",
                flexShrink: 0,
              }}
            />
            Update available: v{updateInfo.latest_version}
            {updateInfo.size_bytes ? (
              <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>({formatBytes(updateInfo.size_bytes)})</span>
            ) : null}
          </div>

          {updateInfo.release_notes && (
            <div
              style={{
                margin: "12px 0",
                padding: "12px 14px",
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                fontSize: "12px",
                color: "var(--text-secondary)",
                whiteSpace: "pre-wrap",
                maxHeight: "160px",
                overflowY: "auto",
                textAlign: "left",
              }}
            >
              {updateInfo.release_notes}
            </div>
          )}

          {!downloading && !readyToInstall && (
            <button
              onClick={downloadUpdate}
              style={{
                ...buttonBase,
                color: "#fff",
                background: "var(--accent-gradient)",
                boxShadow: "0 4px 20px var(--accent-glow)",
                width: "100%",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
              </svg>
              Download Update
            </button>
          )}

          {isDownloading && (
            <div>
              <div
                style={{
                  height: "8px",
                  borderRadius: "6px",
                  background: "var(--bg-tertiary)",
                  border: "1px solid var(--border)",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${percent}%`,
                    background: "var(--accent-gradient)",
                    borderRadius: "6px",
                    transition: "width 0.2s ease",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "8px",
                  fontSize: "12px",
                  color: "var(--text-muted)",
                }}
              >
                <span>
                  {downloadStage === "starting" ? "Starting download..." : `Downloading ${percent}%`}
                </span>
                <span>
                  {received > 0 && total > 0 ? `${formatBytes(received)} / ${formatBytes(total)}` : ""}
                </span>
              </div>
            </div>
          )}

          {readyToInstall && (
            <button
              onClick={installUpdate}
              style={{
                ...buttonBase,
                color: "#fff",
                background: "var(--accent-gradient)",
                boxShadow: "0 4px 20px var(--accent-glow)",
                width: "100%",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z" />
              </svg>
              Install &amp; Restart
            </button>
          )}
        </div>
      )}

      {installError && (
        <div style={{ marginTop: "12px", fontSize: "12px", color: "#ef4444" }}>
          {installError}
        </div>
      )}
    </div>
  );
}
