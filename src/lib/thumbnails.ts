import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { isUrl } from "./media";

export function localFileUrl(path: string): string {
  if (!path || isUrl(path)) return "";
  try {
    return convertFileSrc(path);
  } catch {
    return `https://asset.localhost/${encodeURIComponent(path)}`;
  }
}

export async function resolveThumbUrl(mediaPath: string): Promise<string | null> {
  if (!mediaPath || isUrl(mediaPath)) return null;
  try {
    const thumb = (await invoke("get_thumbnail_path", { path: mediaPath })) as string | null;
    if (thumb) return localFileUrl(thumb);
  } catch {
    /* ignore */
  }
  return null;
}

export async function prepareThumbPath(mediaPath: string): Promise<string | null> {
  if (!mediaPath || isUrl(mediaPath)) return null;
  try {
    return (await invoke("prepare_thumbnail_path", { path: mediaPath })) as string;
  } catch {
    return null;
  }
}
