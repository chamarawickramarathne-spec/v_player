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

export function getMediaType(filename: string): "video" | "audio" | "image" {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  if (VIDEO_EXTS.includes(ext)) return "video";
  if (AUDIO_EXTS.includes(ext)) return "audio";
  if (IMAGE_EXTS.includes(ext)) return "image";
  return "video"; // default to video for unknown types
}
