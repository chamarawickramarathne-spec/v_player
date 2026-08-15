import { useState, useRef, useEffect } from "react";
import type { Track } from "../../types";

interface SubtitleSelectorProps {
  tracks: Track[];
  onSetTrack: (type: string, index: number) => void;
}

export default function SubtitleSelector({ tracks, onSetTrack }: SubtitleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const videoTracks = tracks.filter((t) => t.type === "video");
  const audioTracks = tracks.filter((t) => t.type === "audio");
  const subTracks = tracks.filter((t) => t.type === "sub");

  if (tracks.length === 0) return null;

  return (
    <div ref={panelRef} style={{ position: "relative" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Tracks"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "32px",
          height: "32px",
          borderRadius: "8px",
          color: isOpen ? "var(--accent)" : "var(--text-secondary)",
          background: isOpen ? "var(--accent-dim)" : "transparent",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--accent-dim)";
          e.currentTarget.style.color = "var(--accent)";
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--text-secondary)";
          }
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h2v2H6v-2zm0 4h8v2H6v-2zm10 0h2v2h-2v-2zm-6-4h8v2h-8v-2z" />
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            right: 0,
            marginBottom: "8px",
            background: "var(--controls-bg-solid)",
            backdropFilter: "var(--blur-heavy)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: "8px 0",
            minWidth: "240px",
            maxHeight: "320px",
            overflowY: "auto",
            boxShadow: "var(--shadow-lg)",
            animation: "fadeInUp 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {videoTracks.length > 0 && (
            <>
              <div style={{ padding: "8px 14px 4px", fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                Video Tracks
              </div>
              {videoTracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() => { onSetTrack("video", track.id); setIsOpen(false); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 14px",
                    fontSize: "13px",
                    background: track.selected ? "var(--accent-dim)" : "transparent",
                    color: track.selected ? "var(--accent)" : "var(--text-primary)",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { if (!track.selected) e.currentTarget.style.background = "var(--bg-hover)"; }}
                  onMouseLeave={(e) => { if (!track.selected) e.currentTarget.style.background = "transparent"; }}
                >
                  {track.selected && (
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />
                  )}
                  <span style={{ flex: 1 }}>{track.name || `Track ${track.id + 1}`}</span>
                  {track.decoder && (
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "monospace" }}>
                      {track.decoder}
                    </span>
                  )}
                </button>
              ))}
            </>
          )}

          {audioTracks.length > 0 && (
            <>
              <div style={{ padding: "8px 14px 4px", fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                Audio Tracks
              </div>
              {audioTracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() => { onSetTrack("audio", track.id); setIsOpen(false); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 14px",
                    fontSize: "13px",
                    background: track.selected ? "var(--accent-dim)" : "transparent",
                    color: track.selected ? "var(--accent)" : "var(--text-primary)",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { if (!track.selected) e.currentTarget.style.background = "var(--bg-hover)"; }}
                  onMouseLeave={(e) => { if (!track.selected) e.currentTarget.style.background = "transparent"; }}
                >
                  {track.selected && (
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />
                  )}
                  <span style={{ flex: 1 }}>{track.lang || track.name || `Track ${track.id + 1}`}</span>
                </button>
              ))}
            </>
          )}

          {subTracks.length > 0 && (
            <>
              <div style={{ padding: "8px 14px 4px", fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                Subtitles
              </div>
              <button
                onClick={() => { onSetTrack("sub", -1); setIsOpen(false); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 14px",
                  fontSize: "13px",
                  background: subTracks.every((t) => !t.selected) ? "var(--accent-dim)" : "transparent",
                  color: subTracks.every((t) => !t.selected) ? "var(--accent)" : "var(--text-primary)",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                onMouseLeave={(e) => { if (!(subTracks.every((t) => !t.selected))) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ flex: 1 }}>Off</span>
              </button>
              {subTracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() => { onSetTrack("sub", track.id); setIsOpen(false); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 14px",
                    fontSize: "13px",
                    background: track.selected ? "var(--accent-dim)" : "transparent",
                    color: track.selected ? "var(--accent)" : "var(--text-primary)",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { if (!track.selected) e.currentTarget.style.background = "var(--bg-hover)"; }}
                  onMouseLeave={(e) => { if (!track.selected) e.currentTarget.style.background = "transparent"; }}
                >
                  {track.selected && (
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />
                  )}
                  <span style={{ flex: 1 }}>{track.lang || track.name || `Track ${track.id + 1}`}</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
