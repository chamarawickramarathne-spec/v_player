import { command, getProperty, setProperty } from "tauri-plugin-libmpv-api";
import { invoke } from "@tauri-apps/api/core";
import { getMediaType, isUrl } from "./media";
import { usePlayerStore } from "../stores/playerStore";
import { mpvReady } from "../hooks/useMpv";

let running = false;
let cancelled = false;

function sleep(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

export function cancelThumbGen() {
  cancelled = true;
}

export async function generateMissingThumbs(
  paths: string[],
  onOne: (mediaPath: string) => void
) {
  if (running) return;
  running = true;
  cancelled = false;

  const videos = paths.filter((p) => !isUrl(p) && getMediaType(p) === "video");
  if (videos.length === 0) {
    running = false;
    return;
  }

  const ready = await mpvReady;
  if (!ready || cancelled || usePlayerStore.getState().filePath) {
    running = false;
    return;
  }

  const originalMuted = usePlayerStore.getState().isMuted;
  const originalPaused = usePlayerStore.getState().isPaused;

  try {
    for (const mediaPath of videos) {
      if (cancelled || usePlayerStore.getState().filePath) break;
      try {
        const existing = (await invoke("get_thumbnail_path", { path: mediaPath })) as string | null;
        if (existing) continue;

        const thumbPath = (await invoke("prepare_thumbnail_path", { path: mediaPath })) as string;
        if (!thumbPath) continue;

        const ok = await generateOne(mediaPath, thumbPath);
        if (ok && !cancelled) onOne(mediaPath);
      } catch (err) {
        console.error("Thumbnail generation failed:", mediaPath, err);
      }
    }
  } finally {
    running = false;
    setProperty("mute", originalMuted).catch(console.error);
    if (!usePlayerStore.getState().filePath) {
      setProperty("pause", originalPaused).catch(console.error);
    }
  }
}

async function generateOne(mediaPath: string, thumbPath: string): Promise<boolean> {
  if (cancelled || usePlayerStore.getState().filePath) return false;

  try {
    await setProperty("mute", true);
    await setProperty("pause", true);
    await command("loadfile", [mediaPath, "replace"]);

    let duration = 0;
    for (let i = 0; i < 50; i++) {
      await sleep(200);
      if (cancelled || usePlayerStore.getState().filePath) return false;
      try {
        const d = (await getProperty("duration", "double")) as number | null;
        if (d && d > 0) {
          duration = d;
          break;
        }
      } catch {
        /* keep polling */
      }
    }
    if (duration <= 0) return false;

    const target = Math.min(10, Math.max(1, duration * 0.1));
    await command("seek", [target, "absolute"]);
    await sleep(400);
    if (cancelled || usePlayerStore.getState().filePath) return false;

    await command("screenshot-to-file", [thumbPath]);
    await sleep(250);

    const exists = (await invoke("get_thumbnail_path", { path: mediaPath })) as string | null;
    return !!exists;
  } catch (err) {
    console.error("generateOne failed:", mediaPath, err);
    return false;
  }
}
