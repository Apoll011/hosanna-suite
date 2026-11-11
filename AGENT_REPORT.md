# Agent 7 — Bug Hunting & Reliability Report

**Worktree:** `suite-worktrees/bugs`  
**Branch:** `overhaul/bugs`  
**Date:** 2026-11-11

## Summary

Five high-confidence reliability defects fixed with focused patches and regression tests. No app/auth/lib reorganization.

## Bugs fixed

### 1. `useCanAny` treated AND-cache denial as OR denial (high)

- **Where:** `packages/ui/src/permissions/client.ts`
- **Root cause:** Shared `permCache` keys from `useCanAll` / `fetchPermissionsBatch` are AND semantics. `useCanAny` treated a cached `false` batch result as “any denied,” so a role that has one of two permissions (e.g. guest `song.access` but not `song.create`, or teamLeader `invitation.create` but not `invitation.cancel`) could incorrectly see OR checks as denied after an AND check.
- **Fix:** Added `lookupCachedAny` / `rememberAndResult`. OR lookup trusts batch cache only when `true`; AND `false` is not decisive.
- **Impact:** MembersTab `useCanAny(["invitation.create", "invitation.cancel"])` and similar gates.

### 2. Song search lyrics ignored ChordPro markers (high)

- **Where:** `apps/api/src/mcp/lib/searchRelevance.ts` (`rankSongsByRelevance`)
- **Root cause:** Lyrics scoring used raw `content.toLowerCase().includes(q)` while `lyricsMatchQuery` (chord/directive-stripped) already existed and is used by lyric-specific ranking and the REST song service.
- **Fix:** Score lyrics via `lyricsMatchQuery`.
- **Impact:** MCP `songs_search` missed chorded lyric matches (e.g. `Pois [D9]só Tu…`).

### 3. Idempotency helper race under concurrent same-id calls (high)

- **Where:** `apps/api/src/mcp/lib/idempotency.ts`
- **Root cause:** Classic TOCTOU — two concurrent requests with the same `clientRequestId` both missed the cache and both executed `run()`.
- **Fix:** In-flight promise map keyed by `orgId:id`; same payload coalesces; different payload throws `IdempotencyConflictError`.

### 4. `sortSongs` title tie-break ignored direction for unnumbered songs (medium)

- **Where:** `apps/api/src/mcp/lib/folderSongs.ts`
- **Root cause:** When both `song_number` values were null, the comparator returned the title compare without multiplying by `dir`.
- **Fix:** Apply `dir` to the title tie-break (nulls still always sink to the bottom).

### 5. `formatLongDate` broke on ISO datetimes (medium)

- **Where:** `apps/studio/src/utils/agendaDate.ts`
- **Root cause:** Parsed `iso.split("-")` without stripping the `T…` time portion (unlike `formatShortDate`), producing `NaN` day values.
- **Fix:** Strip time with `split("T")[0]` and return raw/empty on invalid input.

## Deferred / suspected (not fixed)

| Issue | Why deferred |
| --- | --- |
| Open redirect: `isSafeRedirectTarget` allows any `http(s)` absolute URL | Documented by existing auth tests as intentional; tightening to trusted hosts needs a product decision (Studio/Auth/SaaS allowlist). Security-sensitive but currently a feature of the redirect helpers. |
| `@hosanna/cache` `sharedRedis` URL swap can abandon a prior client without disconnect | Rare (URL rarely changes mid-process); would need careful shared-client lifecycle. |
| Replication `diffNewDocumentState` may drop field clears when values become `undefined` (JSON omits them) | Need confirmation clients clear fields as `null` vs delete/`undefined`; speculative without a failing case. |

## Tests added / adjusted

- `packages/ui/test/permissions-client.test.ts` — AND vs OR cache semantics
- `apps/api/test/mcp/lib/idempotency.test.ts` — concurrent coalesce + conflict
- `apps/api/test/mcp/lib/folderSongs.test.ts` — `song_number` desc tie-break
- `apps/api/test/mcp/lib/mcpHarden.test.ts` — ChordPro lyric relevance
- `apps/studio/test/utils/agendaDate.test.ts` — ISO datetime + invalid long dates

## Verification

```text
pnpm --filter @hosanna/api test     → 120 pass / 0 fail
pnpm --filter @hosanna/ui test      → 12 pass / 0 fail
pnpm --filter @hosanna/studio exec tsx --test test/utils/agendaDate.test.ts → 6 pass / 0 fail
```

(Dependency packages `@hosanna/auth`, `@hosanna/cache`, `@hosanna/chordpro`, `@hosanna/db` were built so workspace `dist` exports resolve.)

## Commits

- `6bd5d77956d09995a9eaea7300a2f8fe7f3be573` — fix: correct OR permission cache, chorded search, and idempotency races
