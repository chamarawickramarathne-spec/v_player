# AGENTS_PLAN — MOD 29 (Build 29)

## Goal
Fix close button still not working after MOD 28.

## Root cause
Missing `core:window:allow-destroy`; onCloseRequested path requires destroy IPC.

## Fix
- Remove onCloseRequested from useMpv.ts
- Add core:window:allow-destroy to capabilities

## Status
- Done: code + build → release\VPlayer-Setup-x64.exe (v1.0.15)
