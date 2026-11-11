# Agent 3 — Shared Packages Specialist

**Branch:** `overhaul/packages`  
**Worktree:** `/home/apoll011/coding/Hosanna/suite-worktrees/packages`  
**Scope:** `packages/*` except `packages/auth` (not edited). No `apps/*` edits.

## Summary

Tightened package boundaries and public APIs without breaking existing root exports. Removed duplicate React/Lucide deps from `@hosanna/chordpro`, added clearer subpath exports, improved shared Vite TS config defaults, and cleaned up type safety in a few package internals.

## Changes

### `@hosanna/chordpro`
- Moved `react`, `react-dom`, and `lucide-react` to **peerDependencies** (with matching **devDependencies** for local typecheck/build). Removed them from `dependencies` so hosts own a single React/Lucide graph.
- Removed unused `@types/youtube-player`.
- Ace formatter integration now uses `AceEditorLike` instead of `any`.
- `InstrumentRegistry` stores `InstrumentProfile<unknown>` and exposes a typed `get<TShape>()`.
- `tsconfig` includes `test/` and inherits `strict` from shared Vite config.

### `@hosanna/ui`
- Added backward-compatible subpath `@hosanna/ui/permissions`.
- Documented root barrel vs permissions subpath in `src/index.ts`.
- `tsconfig` includes `test/`.

### `@hosanna/replication`
- Added subpaths `@hosanna/replication/engine` and `@hosanna/replication/replication`.
- Root barrel kept unchanged for existing Studio imports; docs note preferred subpaths.
- `tsconfig` includes `test/`.

### `@hosanna/config`
- `tsconfig/vite.json` now includes `strict`, `esModuleInterop`, `forceConsistentCasingInFileNames`, and `resolveJsonModule` (aligned with `node.json`).

### `@hosanna/types`
- Added `ApiOperation<>` and `ApiPath<>` helpers next to existing `ApiSchema<>`.
- Marked `sideEffects: false`.

### `@hosanna/i18n`
- `lookup` now rejects non-object roots early (same observable results for dicts; safer for primitives).
- `tsconfig` includes `test/`.

### `@hosanna/cache`
- Dropped unused Redis-path `ttl` local; memory backend still uses `opts.ttlMs`.

### `@hosanna/db` / `@hosanna/brand` / `@hosanna/logos-ai`
- Documented `@hosanna/db` as the Prisma entrypoint.
- Brand / types: `sideEffects: false`.
- Logos-ai `tsconfig` no longer duplicates `strict` (inherits from Vite config).

## Risks

- **chordpro peers:** Apps that previously relied on chordpro bundling its own `react` / `lucide-react` must already provide them (Studio/Auth already do via UI). Verify apps still resolve peers after lockfile change.
- **Subpath exports** (`ui/permissions`, `replication/engine|replication`) are additive; old root imports remain valid.
- Did **not** remove unused-but-exported UI helpers (`RoleSwitch`, `withPermission`, `withRole`) — kept for public API stability.
- Did **not** edit `packages/auth` or any `apps/*`.

## Verification

| Package | typecheck | test |
|---|---|---|
| brand | pass | pass (5) |
| cache | pass | pass (5) |
| chordpro | pass | pass (84) |
| db | pass | n/a |
| i18n | pass | pass (16) |
| logos-ai | pass | pass (26) |
| replication | pass | pass (10) |
| types | pass | n/a |
| ui | pass | pass (9) |
| config | n/a (no script) | n/a |

Built prerequisite dists for typecheck: `@hosanna/cache`, `@hosanna/db`, `@hosanna/auth`, `@hosanna/chordpro` (all gitignored `dist/`).

## Intentional non-changes

- No new packages created for small file moves.
- Auth package left to auth agent.
- Wide Prisma `export *` retained (apps depend on it).
- Replication wire helpers still on root barrel (BC).
