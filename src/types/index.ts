export type RepeatMode = "off" | "one" | "all";

export interface PlayerState {
  isPlaying: boolean;
  isPaused: boolean;
  isStopped: boolean;
  isFullscreen: boolean;
  isMuted: boolean;
  volume: number;
  speed: number;
  duration: number;
  currentTime: number;
  mediaTitle: string;
  filePath: string;
  mediaType: "video" | "audio" | "image" | null;
  trackList: Track[];
  playlist: PlaylistItem[];
  playlistIndex: number;
  repeatMode: RepeatMode;
  isShuffled: boolean;
  shuffleOrder: number[] | null;
  abLoopA: number | null;
  abLoopB: number | null;
}

export interface Track {
  id: number;
  type: "video" | "audio" | "sub";
  selected: boolean;
  decoder: string;
  name?: string;
  lang?: string;
}

export interface PlaylistItem {
  path: string;
  name: string;
  mediaType: string;
}

export interface RecentFile {
  path: string;
  name: string;
  last_played: string;
  position: number;
  duration: number;
  media_type: string;
}

export interface AppSettings {
  theme: string;
  accent_color: string;
  hwdec: string;
  volume: number;
  auto_fit_window: boolean;
  show_always_on_top: boolean;
}

export interface MpvConfig {
  initialOptions: Record<string, string>;
  observedProperties: string[];
}

export interface UpdateInfo {
  current_version: string;
  latest_version: string;
  has_update: boolean;
  download_url?: string | null;
  asset_name?: string | null;
  size_bytes?: number | null;
  release_notes?: string | null;
}

export interface UpdateProgress {
  stage: string;
  received: number;
  total: number;
  path?: string | null;
}
