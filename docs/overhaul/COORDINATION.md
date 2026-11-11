# Overhaul Coordination

Base SHA: `e779c38` (see `suite-worktrees/BASE_SHA.txt`).  
Worktrees live under `/home/apoll011/coding/Hosanna/suite-worktrees/<name>`.

## File ownership (do not cross)

| Worktree / branch | Own exclusively | Do not touch |
|-------------------|-----------------|--------------|
| **architect** `overhaul/architect` | `docs/overhaul/**`, `AGENT_REPORT.md` (worktree root) | Any `apps/**`, `packages/**`, CI, scripts (except reading) |
| **packages** `overhaul/packages` | `packages/*` **except** `packages/auth` | `apps/**`, `packages/auth/**` |
| **auth** `overhaul/auth` | `apps/auth/**`, `packages/auth/**` | Other apps; other packages |
| **apps** `overhaul/apps` | `apps/saas/**`, `apps/studio/**`, `apps/api/**` | `apps/auth/**`; prefer not to rewrite `packages/**` (propose deps to packages agent) |
| **bugs** `overhaul/bugs` | Real bug fixes; prefer areas **not** heavily churned above | Large refactors overlapping auth lib / package APIs |
| **quality** `overhaul/quality` | Comment cleanup + dead code; comment-only may be repo-wide | Behavioral refactors; auth lib directory moves |
| **testing** `overhaul/testing` | CI (`.github/workflows/**`), turbo/root scripts, test harnesses, tooling configs | Product feature code except tests |

Source of truth for the table above also: `suite-worktrees/README-INSPECT.md`.

## Hotspots & who owns the pain

| Hotspot | Primary owner | Notes for others |
|---------|---------------|------------------|
| `apps/auth/lib/**` flat tree + `email.service.ts` | **auth** | Apps/packages agents: do not “helpfully” reorganize. Import paths will move. |
| `packages/auth` public exports (`./`, `./server`, `./client`) | **auth** | Packages/ui peer imports RBAC — coordinate before export renames. |
| `packages/ui` permissions ↔ auth | **packages** (structure) + **auth** (RBAC API) | Agree contract before moving permissions out of ui. |
| `packages/db` schema / migrations | **packages** | Auth + api wrappers stay in apps; no second Prisma schema. |
| `packages/types` + `scripts/generate-openapi.mjs` | **packages** (types) + **apps** (API truth) + **testing** (CI) | Don’t regenerate in conflicting ways on parallel branches. |
| `Dockerfile` / compose | **apps** | Include logos-ai + replication for studio; verify api+cache. |
| Deploy path filters | **testing** (preferred) | Sync with apps Docker dependency list. |
| Firestore ACL / open product bugs | **bugs** | See `docs/architecture/improvements.md`. |

## Merge order (do not merge until approved)

1. **`overhaul/architect`** — docs only; land first so ownership is shared.
2. **`overhaul/packages`** — shared contracts, builds, Docker/COPY-adjacent package fixes that live under `packages/*` (not auth).
3. **`overhaul/auth`** — auth app lib restructure + `packages/auth` after package layer stabilizes.
4. **`overhaul/apps`** — studio/api/saas (+ Dockerfile) after shared packages/auth APIs settle.
5. **`overhaul/bugs`** — targeted fixes on a quieter tree.
6. **`overhaul/quality`** — cleanup after moves (avoids rewriting comments that relocate).
7. **`overhaul/testing`** — CI tightening, path filters, coverage last (or small workflow fixes earlier if unblocking C2 — prefer tiny dedicated commits).

## Recommended implementation order (work sequencing)

Same as merge order for **structural** work. Parallelism rules:

- **Safe parallel now:** architect (done), packages (non-auth), bugs in isolated files, testing docs-only CI notes.
- **Wait on auth lib moves:** anything importing `@/lib/...` deep paths in auth-app.
- **Wait on ui/auth split:** studio/auth-app permission imports.
- **Apps Docker fix** can proceed in parallel with packages if limited to `Dockerfile` COPY lines (apps ownership) — do not change package public APIs in that PR.

## Conflict avoidance checklist

Before editing, agents should:

1. Confirm worktree path = `suite-worktrees/<their-name>` and branch = `overhaul/<their-name>`.
2. Re-read this file + `ARCHITECTURE_MAP.md` ownership tables.
3. Prefer additive APIs over renames across package boundaries.
4. Not run merges or pushes to `develop` without human approval.
5. Not amend commits on shared branches they did not create in-session.

## Cross-cutting tickets (map to owners)

| ID | Finding | Owner |
|----|---------|-------|
| C1 | Docker studio missing logos-ai/replication | apps |
| C2 | Deploy path filters incomplete | testing (+ apps awareness) |
| H1 | Auth `lib/` flat | auth |
| H2 | Dist vs src package modes | packages |
| H3 | ui → auth peer coupling | packages (+ auth contract) |
| H4 | Duplicated UA/theme/session helpers | packages extract → auth + apps adopt |
| H5 | OpenAPI mega-script ownership | apps + packages + testing |
| M3 | Auth deploy filters | testing |
| L5 | Firestore ACL | bugs |

## Communication artifacts

| Artifact | Path |
|----------|------|
| Architecture map | `docs/overhaul/ARCHITECTURE_MAP.md` |
| Prioritized findings | `docs/overhaul/FINDINGS.md` |
| This coordination doc | `docs/overhaul/COORDINATION.md` |
| Agent 1 summary | `AGENT_REPORT.md` (worktree root) |
| Swarm inspect helper | `../README-INSPECT.md` (suite-worktrees) |
