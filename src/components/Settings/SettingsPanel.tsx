import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { AppSettings } from "../../types";
import UpdatePanel from "./UpdatePanel";

export type SettingsTab = "general" | "playback" | "about";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

export default function SettingsPanel({ isOpen, onClose, activeTab, onTabChange }: SettingsPanelProps) {
  const [settings, setSettings] = useState<AppSettings>({
    theme: "dark",
    accent_color: "#6366f1",
    hwdec: "auto-safe",
    volume: 1.0,
    auto_fit_window: true,
    show_always_on_top: false,
    language: "en",
  });

  useEffect(() => {
    if (isOpen) loadSettings();
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      const s = (await invoke("get_settings")) as AppSettings;
      setSettings(s);
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  };

  const saveSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    try {
      await invoke("update_settings", { newSettings });
    } catch (err) {
      console.error("Failed to save settings:", err);
    }
  };

  if (!isOpen) return null;

  const accentColors = [
    { color: "#6366f1", name: "Indigo" },
    { color: "#8b5cf6", name: "Violet" },
    { color: "#a855f7", name: "Purple" },
    { color: "#ec4899", name: "Pink" },
    { color: "#ef4444", name: "Red" },
    { color: "#f59e0b", name: "Amber" },
    { color: "#22c55e", name: "Green" },
    { color: "#06b6d4", name: "Cyan" },
    { color: "#3b82f6", name: "Blue" },
  ];

  const tabs = [
    { id: "general" as const, label: "General", icon: "M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97s-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1s.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.58 1.69-.98l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64L19.43 12.97z" },
    { id: "playback" as const, label: "Playback", icon: "M8 5v14l11-7z" },
    { id: "about" as const, label: "About", icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" },
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "fadeIn 0.2s ease-out",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(8px)",
        }}
      />

      {/* Dialog */}
      <div
        style={{
          position: "relative",
          background: "var(--bg-secondary)",
          backdropFilter: "var(--blur-heavy)",
          borderRadius: "16px",
          border: "1px solid var(--border)",
          width: "560px",
          maxHeight: "80vh",
          overflow: "hidden",
          boxShadow: "var(--shadow-lg), 0 0 80px rgba(99, 102, 241, 0.1)",
          animation: "fadeInScale 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px 0",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, letterSpacing: "-0.02em" }}>
            Settings
          </h2>
          <button
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              borderRadius: "10px",
              color: "var(--text-muted)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-hover)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", padding: "16px 24px 0" }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 500,
                color: activeTab === tab.id ? "var(--accent)" : "var(--text-muted)",
                background: activeTab === tab.id ? "var(--accent-dim)" : "transparent",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) e.currentTarget.style.background = "var(--bg-hover)";
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) e.currentTarget.style.background = "transparent";
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: "20px 24px 24px", overflowY: "auto", maxHeight: "calc(80vh - 130px)" }}>
          {/* General Tab */}
          {activeTab === "general" && (
            <div style={{ animation: "fadeIn 0.2s ease-out" }}>
              {/* Theme */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "10px", color: "var(--text-primary)" }}>
                  Theme
                </label>
                <div style={{ display: "flex", gap: "10px" }}>
                  {(["dark", "light"] as const).map((theme) => (
                    <button
                      key={theme}
                      onClick={() => saveSettings({ ...settings, theme })}
                      style={{
                        flex: 1,
                        padding: "12px 16px",
                        borderRadius: "12px",
                        border: `2px solid ${settings.theme === theme ? "var(--accent)" : "var(--border)"}`,
                        background: settings.theme === theme ? "var(--accent-dim)" : "var(--bg-tertiary)",
                        color: settings.theme === theme ? "var(--accent)" : "var(--text-secondary)",
                        fontSize: "13px",
                        fontWeight: 500,
                        textTransform: "capitalize",
                        transition: "all 0.2s",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                      }}
                    >
                      <div
                        style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "6px",
                          background: theme === "dark" ? "#1a1a2e" : "#f0f0f5",
                          border: "1px solid var(--border)",
                        }}
                      />
                      {theme}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Colors */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "10px", color: "var(--text-primary)" }}>
                  Accent Color
                </label>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {accentColors.map(({ color, name }) => (
                    <button
                      key={color}
                      onClick={() => saveSettings({ ...settings, accent_color: color })}
                      title={name}
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "12px",
                        background: color,
                        border: settings.accent_color === color ? "3px solid white" : "3px solid transparent",
                        outline: settings.accent_color === color ? `2px solid ${color}` : "none",
                        cursor: "pointer",
                        transition: "all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                        boxShadow: settings.accent_color === color ? `0 0 16px ${color}50` : "none",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.15)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Language */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "10px", color: "var(--text-primary)" }}>
                  Language
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => saveSettings({ ...settings, language: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid var(--border)",
                    background: "var(--bg-tertiary)",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                    outline: "none",
                    cursor: "pointer",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                >
                  <option value="en">English</option>
                  <option value="zh">Chinese</option>
                  <option value="ja">Japanese</option>
                  <option value="ko">Korean</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>
            </div>
          )}

          {/* Playback Tab */}
          {activeTab === "playback" && (
            <div style={{ animation: "fadeIn 0.2s ease-out" }}>
              {/* Hardware Decoding */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "10px", color: "var(--text-primary)" }}>
                  Hardware Decoding
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {[
                    { value: "auto-safe", label: "Auto (Safe)", desc: "Recommended" },
                    { value: "auto", label: "Auto", desc: "All methods" },
                    { value: "dxva2", label: "DXVA2", desc: "Intel/AMD" },
                    { value: "nvdec", label: "NVDEC", desc: "NVIDIA" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => saveSettings({ ...settings, hwdec: opt.value })}
                      style={{
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: `1px solid ${settings.hwdec === opt.value ? "var(--accent)" : "var(--border)"}`,
                        background: settings.hwdec === opt.value ? "var(--accent-dim)" : "var(--bg-tertiary)",
                        textAlign: "left",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        if (settings.hwdec !== opt.value)
                          e.currentTarget.style.borderColor = "var(--border-hover)";
                      }}
                      onMouseLeave={(e) => {
                        if (settings.hwdec !== opt.value)
                          e.currentTarget.style.borderColor = "var(--border)";
                      }}
                    >
                      <div style={{ fontSize: "13px", fontWeight: 500, color: settings.hwdec === opt.value ? "var(--accent)" : "var(--text-primary)" }}>
                        {opt.label}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                        {opt.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {[
                  {
                    key: "auto_fit_window",
                    label: "Auto-fit window to video",
                    desc: "Resize the window to match the video resolution",
                  },
                  {
                    key: "show_always_on_top",
                    label: "Always on top",
                    desc: "Keep the player above other windows",
                  },
                ].map(({ key, label, desc }) => (
                  <label
                    key={key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 14px",
                      borderRadius: "10px",
                      cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 500 }}>{label}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{desc}</div>
                    </div>
                    <div
                      onClick={() => saveSettings({ ...settings, [key]: !(settings as any)[key] })}
                      style={{
                        width: "40px",
                        height: "22px",
                        borderRadius: "11px",
                        background: (settings as any)[key] ? "var(--accent)" : "var(--bg-tertiary)",
                        border: `1px solid ${(settings as any)[key] ? "var(--accent)" : "var(--border)"}`,
                        position: "relative",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          width: "16px",
                          height: "16px",
                          borderRadius: "50%",
                          background: "white",
                          position: "absolute",
                          top: "2px",
                          left: (settings as any)[key] ? "20px" : "2px",
                          transition: "left 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                        }}
                      />
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* About Tab */}
          {activeTab === "about" && (
            <div style={{ animation: "fadeIn 0.2s ease-out", textAlign: "center", padding: "20px 0" }}>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "16px",
                  background: "var(--accent-gradient)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  boxShadow: "var(--shadow-glow)",
                }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                  <polygon points="8 5 20 12 8 19 8 5" />
                </svg>
              </div>
              <h3 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.02em" }}>
                V Player
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  padding: "16px 24px",
                  background: "var(--bg-tertiary)",
                  borderRadius: "12px",
                  border: "1px solid var(--border)",
                  fontSize: "12px",
                  color: "var(--text-secondary)",
                  textAlign: "left",
                }}
              >
                <div><strong>Engine:</strong> mpv / libmpv</div>
                <div><strong>Framework:</strong> Tauri v2 + React</div>
                <div><strong>License:</strong> MIT</div>
              </div>

              <div
                style={{
                  marginTop: "24px",
                  padding: "16px",
                  background: "var(--bg-tertiary)",
                  borderRadius: "12px",
                  border: "1px solid var(--border)",
                  textAlign: "left",
                }}
              >
                <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "12px" }}>
                  Updates
                </div>
                <UpdatePanel />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
