import { create } from "zustand";
import type { PlayerState, PlaylistItem } from "../types";

interface PlayerActions {
  setPlaying: (playing: boolean) => void;
  setPaused: (paused: boolean) => void;
  setStopped: (stopped: boolean) => void;
  setFullscreen: (fs: boolean) => void;
  setMuted: (muted: boolean) => void;
  setVolume: (vol: number) => void;
  setSpeed: (speed: number) => void;
  setDuration: (dur: number) => void;
  setCurrentTime: (time: number) => void;
  setMediaTitle: (title: string) => void;
  setFilePath: (path: string) => void;
  setMediaType: (type: PlayerState["mediaType"]) => void;
  setPlaylist: (items: PlaylistItem[]) => void;
  setPlaylistIndex: (idx: number) => void;
  addToPlaylist: (item: PlaylistItem) => void;
  removeFromPlaylist: (index: number) => void;
  reorderPlaylist: (fromIndex: number, toIndex: number) => void;
  clearPlaylist: () => void;
  reset: () => void;
}

const initialState: PlayerState = {
  isPlaying: false,
  isPaused: false,
  isStopped: true,
  isFullscreen: false,
  isMuted: false,
  volume: 1.0,
  speed: 1.0,
  duration: 0,
  currentTime: 0,
  mediaTitle: "",
  filePath: "",
  mediaType: null,
  trackList: [],
  playlist: [],
  playlistIndex: -1,
};

export const usePlayerStore = create<PlayerState & PlayerActions>((set) => ({
  ...initialState,

  setPlaying: (isPlaying) =>
    set({ isPlaying, isPaused: !isPlaying, isStopped: false }),
  setPaused: (isPaused) =>
    set({ isPaused, isPlaying: !isPaused, isStopped: false }),
  setStopped: (isStopped) =>
    set({ isStopped, isPlaying: false, isPaused: false, currentTime: 0 }),
  setFullscreen: (isFullscreen) => set({ isFullscreen }),
  setMuted: (isMuted) => set({ isMuted }),
  setVolume: (volume) => set({ volume }),
  setSpeed: (speed) => set({ speed }),
  setDuration: (duration) => set({ duration }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setMediaTitle: (mediaTitle) => set({ mediaTitle }),
  setFilePath: (filePath) => set({ filePath }),
  setMediaType: (mediaType) => set({ mediaType }),
  setPlaylist: (playlist) => set({ playlist }),
  setPlaylistIndex: (playlistIndex) => set({ playlistIndex }),
  addToPlaylist: (item) =>
    set((state) => ({ playlist: [...state.playlist, item] })),
  removeFromPlaylist: (index) =>
    set((state) => ({
      playlist: state.playlist.filter((_, i) => i !== index),
    })),
  reorderPlaylist: (fromIndex, toIndex) =>
    set((state) => {
      const newPlaylist = [...state.playlist];
      const [moved] = newPlaylist.splice(fromIndex, 1);
      newPlaylist.splice(toIndex, 0, moved);

      let newPlaylistIndex = state.playlistIndex;
      if (state.playlistIndex === fromIndex) {
        newPlaylistIndex = toIndex;
      } else if (fromIndex < state.playlistIndex && toIndex >= state.playlistIndex) {
        newPlaylistIndex = state.playlistIndex - 1;
      } else if (fromIndex > state.playlistIndex && toIndex <= state.playlistIndex) {
        newPlaylistIndex = state.playlistIndex + 1;
      }

      return { playlist: newPlaylist, playlistIndex: newPlaylistIndex };
    }),
  clearPlaylist: () => set({ playlist: [], playlistIndex: -1 }),
  reset: () => set(initialState),
}));
