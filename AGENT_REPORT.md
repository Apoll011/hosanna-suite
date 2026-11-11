# Agents 5+6 — Code Quality & Comment Cleanup

**Worktree:** `suite-worktrees/quality`  
**Branch:** `overhaul/quality`  
**Scope:** Comment cleanup + verified-safe dead/obsolete docs only. No auth/lib changes. No behavior changes. No push/merge.

## Comment cleanup stats

| Metric | Count |
| ------ | ----- |
| Files touched (code) | 13 |
| Net lines removed (code + docs) | ~266 |
| Section dividers removed (`// ---…`, `// ===…`) | 86 |
| Step banners removed (`// --- Step N ---`) | 6 |
| Sandwich section labels removed (generic) | 35 |
| Obvious restating one-liners removed | 7 |
| Redundant formatter JSDoc / file headers removed | 8 |
| CSS decorative banners collapsed to one-liners | 20 |
| Residual decorative dividers (post-pass, excl. auth) | 0 |

### What was kept

- Why / edge-case / compatibility comments (e.g. ChordPro dictionary theory notes, CifraClub hyphen alignment, bilingual EN/PT metadata & sections, piano voicing / fallback rationale).
- SPDX / `@license` headers.
- eslint-disable / `@ts-expect-error` with rationale.
- Security, sync, auth, polling, and race-condition comments.

### Hotspots cleaned

- `packages/chordpro/**` (formatter, parser, editor, renderer) — primary AI section-divider noise.
- `apps/studio/src/index.css` — collapsed `/* ==== */` banners.
- `packages/logos-ai/src/mascot/styles.css` — same.

### Intentionally not touched

- `apps/auth/**`, `packages/auth/**` (auth agent ownership).
- Meaningful multi-line theory comments in `chordDictionary.ts`.
- Runtime code paths / APIs / exports (no behavioral edits).

## Dead / obsolete material removed

| Item | Action | Risk |
| ---- | ------ | ---- |
| `docs/architecture/improvements.md` “Done (this pass)” + “Done in OpenAPI” tables + struck nice-to-haves | Removed obsolete completed backlog; kept open items | Low (docs only) |
| `docs/README.md` link to missing `./hosanna.excalidraw` | Pointed at `./scketch/` | Low |

### Not removed (verified still used / not safe)

- `scripts/fix-tailwind.mjs`, `scripts/generate-openapi.mjs`, `scripts/openapi.md` — wired from root / API `package.json`.
- `docs/scketch/*.excalidraw` — design artifacts; now discoverable via docs index (not dead).
- `apps/saas/src/types/ogl.d.ts` — required by `ogl` imports.
- No apps/packages source modules deleted (would raise parallel-agent conflict risk without stronger unused-export proof).

## Residual debt

1. Broader JSDoc restating function names outside chordpro formatter (logos-ai / i18n have many useful docs; left alone).
2. `docs/architecture/deploy-report.md` and `auth-app-migration.md` still useful as ops runbooks; not pruned.
3. Deeper unused-export / unused-file analysis across apps (Studio/API) deferred — high merge-conflict risk with parallel agents; needs knip/ts-prune with full install.
4. `docs/scketch` directory name typo (`sketch`) left unchanged to avoid path churn.

## Conflict risk notes

- **Low:** docs-only edits; CSS banner collapse in Studio / Logos.
- **Moderate (localized):** `packages/chordpro` comment-only churn — mechanical, no logic. Parallel agents editing chordpro logic could conflict on nearby lines.
- **Avoided:** auth/lib, env secrets, route/service reorganizations.

## Verification

- Residual decorative divider scan (excl. auth): **0**.
- `packages/chordpro`: `tsc --noEmit` via `../../node_modules/.bin/tsc` → **exit 0**.
- `pnpm --filter @hosanna/chordpro …` hung in this worktree environment; used direct `tsc` instead.
- No `.env` files touched.
- Branch not pushed / not merged.
