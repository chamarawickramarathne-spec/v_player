const VIDEO_EXTS = [
  "mp4", "mkv", "avi", "mov", "wmv", "flv", "webm", "ts", "m2ts", "3gp", "ogv",
  "rm", "rmvb", "vob", "asf", "divx", "f4v", "m4v", "mpg", "mpeg", "3g2", "mts",
  "mxf", "nsv", "ogm",
];

const AUDIO_EXTS = [
  "mp3", "flac", "aac", "ogg", "wav", "wma", "m4a", "opus", "ac3", "dts", "alac",
  "aiff", "ape", "mid", "midi", "ra", "tta", "tak", "dsf", "dff",
];

const IMAGE_EXTS = [
  "jpg", "jpeg", "png", "bmp", "gif", "tiff", "tif", "webp", "svg", "ico",
  "heic", "heif", "avif", "jxl", "psd", "tga", "hdr", "exr", "pcx", "pgm",
  "ppm", "pnm", "sfw",
];

const MEDIA_EXT_SET = new Set([...VIDEO_EXTS, ...AUDIO_EXTS, ...IMAGE_EXTS]);

export function getExtension(filename: string): string {
  const base = filename.split(/[\\/]/).pop() || filename;
  const dot = base.lastIndexOf(".");
  if (dot <= 0) return "";
  return base.slice(dot + 1).toLowerCase();
}

export function isMediaFile(filename: string): boolean {
  return MEDIA_EXT_SET.has(getExtension(filename));
}

export function normalizePath(path: string): string {
  return path.replace(/\//g, "\\").toLowerCase();
}

export function getMediaType(filename: string): "video" | "audio" | "image" {
  const ext = getExtension(filename);
  if (VIDEO_EXTS.includes(ext)) return "video";
  if (AUDIO_EXTS.includes(ext)) return "audio";
  if (IMAGE_EXTS.includes(ext)) return "image";
  return "video";
}

export const MEDIA_EXTENSIONS = [...VIDEO_EXTS, ...AUDIO_EXTS, ...IMAGE_EXTS];
