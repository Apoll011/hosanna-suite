# Agent 1 — Repository Architect Report

**Worktree:** `/home/apoll011/coding/Hosanna/suite-worktrees/architect`  
**Branch:** `overhaul/architect`  
**Baseline:** `e779c38`  
**Scope:** Architecture audit only — docs under `docs/overhaul/` (+ this report). No app/package source edits. No merge/push.

## Deliverables

| File | Purpose |
|------|---------|
| `docs/overhaul/ARCHITECTURE_MAP.md` | Monorepo map, runtime topology, `workspace:*` graph, turbo/CI/Docker |
| `docs/overhaul/FINDINGS.md` | Prioritized Critical → Low findings + health sample |
| `docs/overhaul/COORDINATION.md` | Agent ownership, merge order, conflict rules |
| `AGENT_REPORT.md` | This summary |

## Key architectural findings

1. **Critical deploy/Docker gaps for Studio:** `Dockerfile` studio-build and deploy-studio path filters omit `@hosanna/logos-ai` and `@hosanna/replication` despite Studio depending on them. Auth deploy similarly under-lists `logos-ai` / `cache`.
2. **Auth app `lib/` is the main structural pain point:** flat 23-file directory (~3.1k LOC), with `email.service.ts` at 1208 LOC. Owned exclusively by `overhaul/auth` — other agents must not reorganize it.
3. **Layering / coupling:** `@hosanna/ui` peer-depends on `@hosanna/auth` for permissions; `logos-ai` sits on chordpro+i18n+ui. Dist-built packages (`auth`/`cache`/`db`/`chordpro`) vs src-direct packages create brittle isolated typechecks — turbo `^build` is load-bearing.
4. **Duplication:** parseUserAgent, theme/session/handoff patterns between auth-app and studio; SaaS keeps a parallel Radix UI kit beside `@hosanna/ui`; i18n catalogs are intentionally fragmented but locale naming drifts (`pt` vs `pt-PT`).
5. **OpenAPI:** root `scripts/generate-openapi.mjs` (~1.5k LOC) feeds `packages/types`; API does not depend on `@hosanna/types` — contract ownership needs clearer single-writer discipline.
6. **Otherwise solid:** clear four-app product split (saas / studio / auth / api), shared Prisma via `@hosanna/db`, Better Auth factory in `@hosanna/auth`, turbo graph and CI typecheck→build→test are coherent.

## Recommended order for other branches

`architect` → `packages` → `auth` → `apps` → `bugs` → `quality` → `testing`  
(Details in `COORDINATION.md`.)

## Health notes (sampled)

- Leaf packages (`i18n`, `brand`, `cache`, `replication`, `types`, `db`) typecheck clean after install.
- `@hosanna/auth` / `@hosanna/ui` / `@hosanna/logos-ai` typecheck fail **until** their dist deps are built; after building cache→db→auth, auth+ui typecheck and ui tests (9) pass.
- Full monorepo `pnpm typecheck` / `pnpm test` not run end-to-end in this pass; rely on CI for full green.

## Explicit non-actions

- Did not edit `apps/**` or `packages/**` source.
- Did not merge to `develop` or push remote.
- Local `dist/` from sample builds is gitignored and unstaged.
