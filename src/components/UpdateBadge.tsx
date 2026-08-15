import { useUpdaterStore } from "../stores/updaterStore";

interface UpdateBadgeProps {
  onOpenUpdates: () => void;
}

export default function UpdateBadge({ onOpenUpdates }: UpdateBadgeProps) {
  const appVersion = useUpdaterStore((s) => s.appVersion);
  const checking = useUpdaterStore((s) => s.checking);
  const updateInfo = useUpdaterStore((s) => s.updateInfo);
  const checkForUpdates = useUpdaterStore((s) => s.checkForUpdates);

  const hasUpdate = !!updateInfo?.has_update;

  const handleClick = () => {
    if (hasUpdate) {
      onOpenUpdates();
    } else {
      checkForUpdates();
    }
  };

  return (
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
        title={
          hasUpdate
            ? `Update available: v${updateInfo.latest_version}`
            : checking
              ? "Checking for updates..."
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
          color: hasUpdate ? "var(--accent)" : "var(--text-secondary)",
          background: hasUpdate ? "var(--accent-dim)" : "var(--bg-glass)",
          border: hasUpdate ? "1px solid var(--accent)" : "1px solid var(--border)",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = hasUpdate ? "var(--accent)" : "var(--bg-hover)";
          e.currentTarget.style.color = hasUpdate ? "#fff" : "var(--text-primary)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = hasUpdate ? "var(--accent-dim)" : "var(--bg-glass)";
          e.currentTarget.style.color = hasUpdate ? "var(--accent)" : "var(--text-secondary)";
        }}
      >
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: hasUpdate ? "currentColor" : "transparent",
            border: hasUpdate ? "none" : "1px solid var(--text-muted)",
            flexShrink: 0,
            animation: hasUpdate ? "pulse 2.5s ease-in-out infinite" : "none",
          }}
        />
        {checking ? "Checking…" : hasUpdate ? "Update available" : "Update"}
      </button>
    </div>
  );
}
