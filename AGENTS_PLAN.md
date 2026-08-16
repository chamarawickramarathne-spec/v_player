# AGENTS_PLAN — MOD 28 (Build 28)

## Goal
Fix close button not closing the player.

## Root cause
onCloseRequested awaited savePlaybackPosition; Tauri destroy only after handler resolves.

## Fix
preventDefault + timed save + always destroy; cancel-safe listener.

## Status
- Done: code + build → release\VPlayer-Setup-x64.exe (v1.0.14)
