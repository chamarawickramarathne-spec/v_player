import { create } from "zustand";
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
}

const defaultSettings: AppSettings = {
  theme: "dark",
  accent_color: "#6366f1",
  hwdec: "auto-safe",
  volume: 1.0,
  auto_fit_window: true,
  show_always_on_top: false,
  language: "en",
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
}));
