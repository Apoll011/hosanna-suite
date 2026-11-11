# Agent 2 — Application Refactoring Report

**Worktree:** `/home/apoll011/coding/Hosanna/suite-worktrees/apps`  
**Branch:** `overhaul/apps`  
**Scope:** `apps/saas`, `apps/studio`, `apps/api` only (did not touch `apps/auth` or `packages/*`)

## Summary

Genuine quality cleanup across the three owned apps: dead local code removal, clearer module boundaries, consistent route naming, and safer/error-aware UX where behavior was clearly broken or leaking internals. No artificial Clean Architecture layers; behavior preserved aside from intentional contact-form and API error-envelope fixes.

## Commits

| SHA | Message |
| --- | --- |
| `3cc982781fa37acbc2f4d5b51ecf915e07c90b4d` | `refactor(saas): dedupe reveal hook, fix contact form, drop unused assets` |
| `b07e6faacc83ee4994cd74bf68c72ab495075a01` | `refactor(studio): remove dead code and tighten import/folder boundaries` |
| `a2349411117f9a7face9f8f1d441307e56f91005` | `refactor(api): harden errors and align annotation/cifra routes` |
| *(this report)* | `docs: add AGENT_REPORT for apps overhaul` |

## What changed & why

### `apps/saas`

- **Shared `useReveal`** — About/Contact had duplicated IntersectionObserver hooks; they now import `@/hooks/useReveal`.
- **Contact form actually works** — previously `preventDefault()` with no submit path. Form fields are controlled and submit opens a `mailto:` draft to `hosanna.songbook@gmail.com`. Privacy link routes to `/privacy`; social links are real anchors.
- **Unused assets removed** — PNG/SVG duplicates never referenced in source (webp equivalents remain). Cuts ~8MB of dead binary weight from the app tree.

### `apps/studio`

- **Dead code removed** — unused `AppLink.tsx`; `CifraModal.tsx` was only a stale re-export of `ThirdPartyProvidersModal`.
- **Dead utils removed** — unused `buildFolderTree(songs…)`, `printHtmlDirectly`, `parseCifraClubInput`, and unused `FolderNode` type.
- **Import types boundary** — `SongImportProvider` / result types moved from `utils/import.ts` into `lib/import/types.ts` and re-exported from `lib/import`.
- **Folder move UI DRY** — `MoveSongModal` / `BatchMoveModal` reused explorer `buildFolderTree` + `MoveFolderTreeItem` (with optional `disabledLabel`) instead of copy-pasted trees.
- **Filename typos** — `Anouncement.tsx` → `Announcement.tsx`; `ChorproSettings.tsx` → `ChordProSettings.tsx`.

### `apps/api`

- **Error handler leak fixed** — 500 responses no longer serialize `data: err` (stack/internals). Prisma known errors also drop raw `cause` payloads. Dev-only `details: message` when not production/Vercel.
- **Annotation routes hardened** — `asyncHandler` + `AppError` for consistent `{ error: { code, message } }` envelopes; named export `annotationRouter` (was default `anotationRouter`).
- **Route naming** — `cifra.route.ts` → `cifra.routes.ts` to match sibling routers.

## Risks

| Risk | Mitigation / notes |
| --- | --- |
| Contact form now depends on the user’s mail client | Intentional; marketing site has no contact API. Behavior is better than a no-op submit. |
| Annotation 404/400 shape changed from `{ error: string }` to AppError envelope | Aligns with the rest of the API; Studio client already unwraps both shapes. |
| Move modals share radio `name="moveTargetRadio"` | Same as explorer modal; only one move UI open at a time in practice. |
| Asset deletions | Verified zero source references; kept webp/jpeg variants still used. |

## Verification

Commands run from worktree root after `pnpm install` and building `@hosanna/{auth,db,cache,chordpro}` (dist was missing in this worktree):

| Check | Result |
| --- | --- |
| `pnpm --filter @hosanna/saas typecheck` | **Pass** |
| `pnpm --filter @hosanna/studio typecheck` | **Pass** |
| `pnpm --filter @hosanna/api typecheck` | **Pass** |
| `pnpm --filter @hosanna/studio test` | **Pass** — 52/52 |
| `pnpm --filter @hosanna/api test` | **Pass** — 117/117 |
| Lint | Not run separately (no lint failures observed via typecheck); saas has no unit tests. |

**Not done:** push, merge, or changes under `apps/auth` / `packages/*` / `.env`.
