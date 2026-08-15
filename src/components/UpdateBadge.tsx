import { useUpdaterStore } from "../stores/updaterStore";

interface UpdateBadgeProps {
  onClick: () => void;
}

export default function UpdateBadge({ onClick }: UpdateBadgeProps) {
  const updateInfo = useUpdaterStore((s) => s.updateInfo);

  if (!updateInfo?.has_update) return null;

  return (
    <button
      onClick={onClick}
      title={`Update available: v${updateInfo.latest_version}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 12px",
        borderRadius: "8px",
        fontSize: "12px",
        fontWeight: 600,
        color: "var(--accent)",
        background: "var(--accent-dim)",
        border: "1px solid var(--accent)",
        transition: "all 0.2s",
        animation: "pulse 2.5s ease-in-out infinite",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--accent)";
        e.currentTarget.style.color = "#fff";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--accent-dim)";
        e.currentTarget.style.color = "var(--accent)";
      }}
    >
      <span
        style={{
          width: "7px",
          height: "7px",
          borderRadius: "50%",
          background: "currentColor",
          flexShrink: 0,
        }}
      />
      Update
    </button>
  );
}
