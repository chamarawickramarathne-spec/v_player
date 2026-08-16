import { create } from "zustand";
import type { PlayerState, PlaylistItem, RepeatMode } from "../types";

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
  setRepeatMode: (mode: RepeatMode) => void;
  setShuffled: (shuffled: boolean, order: number[] | null) => void;
  setAbLoopA: (t: number | null) => void;
  setAbLoopB: (t: number | null) => void;
  clearAbLoop: () => void;
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
  repeatMode: "off",
  isShuffled: false,
  shuffleOrder: null,
  abLoopA: null,
  abLoopB: null,
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

      return {
        playlist: newPlaylist,
        playlistIndex: newPlaylistIndex,
        isShuffled: false,
        shuffleOrder: null,
      };
    }),
  clearPlaylist: () =>
    set({
      playlist: [],
      playlistIndex: -1,
      isShuffled: false,
      shuffleOrder: null,
    }),
  setRepeatMode: (repeatMode) => set({ repeatMode }),
  setShuffled: (isShuffled, shuffleOrder) => set({ isShuffled, shuffleOrder }),
  setAbLoopA: (abLoopA) => set({ abLoopA }),
  setAbLoopB: (abLoopB) => set({ abLoopB }),
  clearAbLoop: () => set({ abLoopA: null, abLoopB: null }),
  reset: () => set(initialState),
}));
