import { create } from "zustand";
import { invoke, Channel } from "@tauri-apps/api/core";
import type { UpdateInfo, UpdateProgress } from "../types";

interface UpdaterState {
  appVersion: string;
  checking: boolean;
  checkedOnce: boolean;
  checkError: string | null;
  updateInfo: UpdateInfo | null;
  downloading: boolean;
  downloadStage: string;
  received: number;
  total: number;
  downloadedPath: string | null;
  installError: string | null;
  loadAppVersion: () => Promise<void>;
  checkForUpdates: () => Promise<void>;
  downloadUpdate: () => Promise<void>;
  installUpdate: () => Promise<void>;
  reset: () => void;
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  const digits = value >= 100 || i === 0 ? 0 : 1;
  return `${value.toFixed(digits)} ${units[i]}`;
}

export const useUpdaterStore = create<UpdaterState>((set, get) => ({
  appVersion: "1.0.0",
  checking: false,
  checkedOnce: false,
  checkError: null,
  updateInfo: null,
  downloading: false,
  downloadStage: "idle",
  received: 0,
  total: 0,
  downloadedPath: null,
  installError: null,

  loadAppVersion: async () => {
    try {
      const v = (await invoke("get_app_version")) as string;
      if (v) set({ appVersion: v });
    } catch (err) {
      console.error("Failed to load app version:", err);
    }
  },

  checkForUpdates: async () => {
    if (get().checking) return;
    set({ checking: true, checkError: null });
    try {
      const info = (await invoke("check_for_update")) as UpdateInfo;
      set({ updateInfo: info, checking: false, checkedOnce: true, appVersion: info.current_version || get().appVersion });
    } catch (err) {
      set({ checkError: String(err), checking: false, checkedOnce: true });
    }
  },

  downloadUpdate: async () => {
    const info = get().updateInfo;
    if (!info?.download_url || get().downloading) return;
    set({
      downloading: true,
      downloadStage: "starting",
      received: 0,
      total: 0,
      downloadedPath: null,
      installError: null,
    });
    const channel = new Channel<UpdateProgress>();
    channel.onmessage = (msg) => {
      set({
        downloadStage: msg.stage,
        received: msg.received,
        total: msg.total,
        downloadedPath: msg.path ?? null,
      });
    };
    try {
      await invoke("download_update", { url: info.download_url, channel });
    } catch (err) {
      set({ installError: String(err), downloading: false, downloadStage: "error" });
    }
  },

  installUpdate: async () => {
    const path = get().downloadedPath;
    if (!path) return;
    set({ installError: null });
    try {
      await invoke("install_update", { path });
    } catch (err) {
      set({ installError: String(err) });
    }
  },

  reset: () =>
    set({
      checking: false,
      checkedOnce: false,
      checkError: null,
      updateInfo: null,
      downloading: false,
      downloadStage: "idle",
      received: 0,
      total: 0,
      downloadedPath: null,
      installError: null,
    }),
}));
