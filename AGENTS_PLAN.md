# AGENTS_PLAN - Updater Resilience + One-Click Verification (Build 23 / v1.0.9, v1.0.10)

## Goal
Make the updater immune to GitHub API rate limits (Atom-feed fallback) and finish the one-click verification.

## Why (Build 22 result)
- v1.0.8 released; `releases/latest` verified returning v1.0.8.
- User installed v1.0.7 and clicked Update -> "Update check failed - check your internet connection" (the new honest error toast).
- Cause: unauthenticated GitHub API rate limit (60/hr) exhausted during diagnostics -> API returns 403. The updater had no fallback. **The app's only dependency on `api.github.com` was the single point of failure.**

## Plan - Build 23 (v1.0.9) - DONE
- [x] `updater.rs`: API first; Atom-feed fallback; `github_error()` for 403/429.
- [x] `updaterStore.ts`: real error messages in toasts.
- [x] Version 1.0.9, docs, build, commit 089b738, released v1.0.9.

## Plan - Build 24 (v1.0.10, verification release) - DONE
- [x] Version bump 1.0.9 -> 1.0.10, build, commit c74e217, released v1.0.10.
- [x] Atom feed verified showing first entry <title>v1.0.10</title>.
- PENDING (user): install v1.0.9 manually, open app -> badge "Download v1.0.10" -> one-click update test.
