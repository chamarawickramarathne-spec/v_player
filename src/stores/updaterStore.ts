import { create } from "zustand";
import { invoke, Channel } from "@tauri-apps/api/core";
import type { UpdateInfo, UpdateProgress } from "../types";

export interface UpdateFeedback {
  type: "checking" | "upToDate" | "error" | "downloadStarted" | "downloaded";
  message: string;
}

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
  feedback: UpdateFeedback | null;
  channel: Channel<UpdateProgress> | null;
  loadAppVersion: () => Promise<void>;
  checkForUpdates: () => Promise<void>;
  downloadUpdate: () => Promise<void>;
  installUpdate: () => Promise<void>;
  oneClickUpdate: () => Promise<void>;
  clearFeedback: () => void;
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
  feedback: null,
  channel: null,

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
    set({ checking: true, checkError: null, feedback: { type: "checking", message: "Checking for updates..." } });
    try {
      const info = (await invoke("check_for_update")) as UpdateInfo;
      set({ updateInfo: info, checking: false, checkedOnce: true, appVersion: info.current_version || get().appVersion });
    } catch (err) {
      set({
        checkError: String(err),
        checking: false,
        checkedOnce: true,
        feedback: { type: "error", message: "Update check failed" },
      });
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
      feedback: { type: "downloadStarted", message: `Downloading v${info.latest_version}...` },
    });
    const channel = new Channel<UpdateProgress>();
    channel.onmessage = (msg) => {
      if (msg.stage === "error") {
        set({
          downloading: false,
          downloadStage: "error",
          channel: null,
          installError: msg.path ?? "Download failed",
          feedback: { type: "error", message: "Download failed" },
        });
        return;
      }
      set({
        downloadStage: msg.stage,
        received: msg.received,
        total: msg.total,
        downloadedPath: msg.path ?? null,
      });
      if (msg.stage === "complete") {
        set({
          downloading: false,
          channel: null,
          feedback: { type: "downloaded", message: `v${info.latest_version} downloaded — install now` },
        });
      }
    };
    set({ channel });
    try {
      await invoke("download_update", { url: info.download_url, channel });
    } catch (err) {
      set({ installError: String(err), downloading: false, downloadStage: "error", channel: null });
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

  oneClickUpdate: async () => {
    const s = get();
    if (s.downloading) return;
    if (s.downloadStage === "complete" && s.downloadedPath) {
      await s.installUpdate();
      return;
    }
    if (s.updateInfo?.has_update) {
      await s.downloadUpdate();
      return;
    }
    if (s.checking) return;
    await s.checkForUpdates();
    const info = get().updateInfo;
    if (info?.has_update) {
      await get().downloadUpdate();
    } else {
      set({ feedback: { type: "upToDate", message: `Up to date · v${info?.current_version || s.appVersion}` } });
    }
  },

  clearFeedback: () => set({ feedback: null }),

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
      feedback: null,
      channel: null,
    }),
}));
