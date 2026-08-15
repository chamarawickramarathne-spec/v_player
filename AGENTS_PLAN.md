# AGENTS_PLAN - Updater Resilience + One-Click Verification (Build 23 / v1.0.9, v1.0.10)

## Goal
Make the updater immune to GitHub API rate limits (Atom-feed fallback) and finish the one-click verification.

## Why (Build 22 result)
- v1.0.8 released; `releases/latest` verified returning v1.0.8.
- User installed v1.0.7 and clicked Update -> "Update check failed - check your internet connection" (the new honest error toast).
- Cause: unauthenticated GitHub API rate limit (60/hr) exhausted during diagnostics -> API returns 403. The updater had no fallback. **The app's only dependency on `api.github.com` was the single point of failure.**

## Plan - Build 23 (v1.0.9)
- [x] `updater.rs`: try API first; on ANY failure fall back to `releases.atom` (github.com, not rate-limited). Parse first `<entry><title>` as latest tag; build deterministic download URL; omit size/notes. `github_error()` maps 403/429 -> "GitHub API rate limit reached - try again in a few minutes".
- [x] `updaterStore.ts`: error toasts now show the backend's real message instead of a generic string.
- [x] Version 1.0.8 -> 1.0.9. Docs MOD 23 / Build 23.
- [ ] Verify tsc + cargo check, build, commit, push, release v1.0.9.
- User manually installs v1.0.9 (installed v1.0.7 still has no atom fallback).

## Plan - Build 24 (v1.0.10, verification release)
- Version bump 1.0.9 -> 1.0.10 (no code change), build, commit, release.
- Verify in v1.0.9: badge shows "Download v1.0.10" (via atom, even while API is rate-limited) -> one click -> download -> auto-install -> guided wizard -> v1.0.10 -> "Up to date - v1.0.10" toast.
