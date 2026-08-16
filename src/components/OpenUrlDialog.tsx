import { useState, useEffect, useRef } from "react";
import { isUrl } from "../lib/media";

interface OpenUrlDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: (url: string) => void;
}

export default function OpenUrlDialog({ isOpen, onClose, onOpen }: OpenUrlDialogProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setUrl("");
      setError("");
      window.setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const submit = () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Enter a URL");
      return;
    }
    if (!isUrl(trimmed)) {
      setError("Use http://, https://, rtmp://, or rtsp://");
      return;
    }
    onOpen(trimmed);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 500,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "440px",
          maxWidth: "92vw",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          boxShadow: "var(--shadow-lg)",
          padding: "20px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>Open URL</h3>
          <button
            onClick={onClose}
            style={{ color: "var(--text-muted)", width: 28, height: 28, borderRadius: 6 }}
          >
            ✕
          </button>
        </div>
        <input
          ref={inputRef}
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") onClose();
          }}
          placeholder="https://example.com/stream.m3u8"
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--bg-tertiary)",
            color: "var(--text-primary)",
            fontSize: 13,
            outline: "none",
          }}
        />
        {error && (
          <div style={{ color: "#f87171", fontSize: 12, marginTop: 8 }}>{error}</div>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
              fontSize: 13,
            }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              background: "var(--accent)",
              color: "white",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Open
          </button>
        </div>
      </div>
    </div>
  );
}
