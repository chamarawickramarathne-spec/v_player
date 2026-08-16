import { useEffect, useCallback } from "react";

interface ShortcutHandlers {
  onPlayPause: () => void;
  onStop: () => void;
  onSeekForward: () => void;
  onSeekBackward: () => void;
  onSeekForwardLarge: () => void;
  onSeekBackwardLarge: () => void;
  onVolumeUp: () => void;
  onVolumeDown: () => void;
  onMute: () => void;
  onFullscreen: () => void;
  onOpenFile: () => void;
  onOpenUrl?: () => void;
  onNextFrame: () => void;
  onPrevFrame: () => void;
  onSpeedUp: () => void;
  onSpeedDown: () => void;
  onSpeedReset: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  onTogglePlaylist: () => void;
  onCycleRepeat?: () => void;
  onToggleShuffle?: () => void;
  onCycleAbLoop?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          handlers.onPlayPause();
          break;
        case "ArrowRight":
          e.preventDefault();
          if (e.shiftKey) handlers.onSeekForwardLarge();
          else handlers.onSeekForward();
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (e.shiftKey) handlers.onSeekBackwardLarge();
          else handlers.onSeekBackward();
          break;
        case "ArrowUp":
          e.preventDefault();
          handlers.onVolumeUp();
          break;
        case "ArrowDown":
          e.preventDefault();
          handlers.onVolumeDown();
          break;
        case "m":
        case "M":
          handlers.onMute();
          break;
        case "f":
        case "F":
          handlers.onFullscreen();
          break;
        case "Escape":
          handlers.onFullscreen();
          break;
        case "o":
        case "O":
          if (e.ctrlKey) {
            e.preventDefault();
            handlers.onOpenFile();
          }
          break;
        case "u":
        case "U":
          if (e.ctrlKey) {
            e.preventDefault();
            handlers.onOpenUrl?.();
          }
          break;
        case ".":
          handlers.onNextFrame();
          break;
        case ",":
          handlers.onPrevFrame();
          break;
        case "]":
          handlers.onSpeedUp();
          break;
        case "[":
          handlers.onSpeedDown();
          break;
        case "\\":
          handlers.onSpeedReset();
          break;
        case "n":
        case "N":
          handlers.onNextTrack();
          break;
        case "p":
        case "P":
          handlers.onPrevTrack();
          break;
        case "l":
        case "L":
          handlers.onTogglePlaylist();
          break;
        case "r":
        case "R":
          handlers.onCycleRepeat?.();
          break;
        case "s":
        case "S":
          if (!e.ctrlKey) handlers.onToggleShuffle?.();
          break;
        case "a":
        case "A":
          if (!e.ctrlKey) handlers.onCycleAbLoop?.();
          break;
      }
    },
    [handlers],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
