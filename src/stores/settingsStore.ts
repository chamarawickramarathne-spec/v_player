import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { AppSettings, RecentFile } from "../types";

interface SettingsState {
  settings: AppSettings;
  recentFiles: RecentFile[];
  libraryView: "recent" | "grid";
  settingsOpen: boolean;
  setSettings: (s: AppSettings) => void;
  setRecentFiles: (files: RecentFile[]) => void;
  setLibraryView: (v: "recent" | "grid") => void;
  setSettingsOpen: (open: boolean) => void;
  loadSettings: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  theme: "dark",
  accent_color: "#6366f1",
  hwdec: "auto-safe",
  volume: 1.0,
  auto_fit_window: true,
  show_always_on_top: false,
};

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: defaultSettings,
  recentFiles: [],
  libraryView: "recent",
  settingsOpen: false,
  setSettings: (settings) => set({ settings }),
  setRecentFiles: (recentFiles) => set({ recentFiles }),
  setLibraryView: (libraryView) => set({ libraryView }),
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
  loadSettings: async () => {
    try {
      const s = (await invoke("get_settings")) as AppSettings;
      set({ settings: s });
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  },
}));
