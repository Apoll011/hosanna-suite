# Hosanna Suite — Architecture Findings

Prioritized for the overhaul swarm. Baseline: `e779c38`.  
Severity reflects **architectural risk / coordination cost**, not always production sev.

---

## Critical

### C1. Docker Studio image omits runtime workspace packages

**Where:** `Dockerfile` `studio-build` stage  
**What:** Studio depends on `@hosanna/logos-ai` and `@hosanna/replication`, but the Docker build only `COPY`s config/auth/chordpro/types/i18n/ui/brand + `apps/studio`. Local `pnpm docker:up` / production-like nginx image can fail install/build or ship a broken bundle.  
**Owner:** `overhaul/apps` (Dockerfile) with `overhaul/packages` verifying package entrypoints.  
**Fix direction:** Add missing package.json + source COPY lines (and any transitive packages) to match `apps/studio/package.json`.

### C2. Deploy path filters omit Studio package triggers

**Where:** `.github/workflows/deploy-studio-preview.yml`, `deploy-studio-production.yml`  
**What:** Path filters include auth/brand/chordpro/config/i18n/types/ui but **not** `packages/logos-ai/**` or `packages/replication/**` (or `packages/cache/**` if ever wired). Changes that only touch those packages will not redeploy Studio.  
**Owner:** `overhaul/testing` (workflows) or `overhaul/apps` if co-located with Docker fix.  
**Fix direction:** Extend `paths:` to every workspace dependency of Studio (and Auth deploy for logos-ai already partially covered via auth app deps — auth deploy also misses `packages/logos-ai/**` and `packages/cache/**`).

---

## High

### H1. `apps/auth/lib/` flat structure (known pain point)

**Where:** `apps/auth/lib/*` — **23 files, ~3079 LOC**; `email.service.ts` = **1208 LOC**  
**What:** Env, Prisma, Better Auth wiring, session/org/AI caches, Resend, Supabase, theme, UA parsing, Studio handoff, and multiple `*-api.ts` clients sit in one flat directory. High collision risk for parallel agents; hard to navigate; email monolith mixes transport + templates + product events.  
**Owner:** **`overhaul/auth` exclusively** (`apps/auth` + `packages/auth`).  
**Fix direction (suggested, not implemented here):**

```
lib/
  auth/          # auth.ts, auth-client.ts, env, prisma
  email/         # email.service split by domain
  cache/         # session-cache, org-cache, ai-settings-cache
  integrations/  # supabase, resend, hosanna-api, ai-api, backup-api, notifications-api
  ui/            # theme, theme-boot, i18n, org-ui, captcha, compress-image
  navigation/    # redirect, studioHandoff, parse-user-agent
```

Do **not** move shared RBAC/factory code into the app — keep that in `packages/auth`.

### H2. Mixed package consume modes (dist vs src-direct)

**Where:** packages with `build` → `dist/` vs packages exporting `./src`  
**What:** `auth`/`cache`/`db`/`chordpro` require build before typecheck consumers; `ui`/`logos-ai`/`i18n`/`replication`/`types` are source. Isolated `pnpm --filter` typecheck fails without prior `^build` (see Health). Increases agent confusion and CI/local asymmetry.  
**Owner:** `overhaul/packages`  
**Fix direction:** Document as intentional **or** converge (prefer consistent “build shared libs” or “TypeScript project references / src exports”). At minimum, README + turbo already encode `^build` — call it out in package READMEs.

### H3. `@hosanna/ui` peer-depends on `@hosanna/auth` (layer inversion)

**Where:** `packages/ui` permissions hooks import roles/statement from `@hosanna/auth`  
**What:** A presentational package cannot typecheck without building auth. SaaS (marketing) pulls `ui` and thus the auth peer surface even if unused. Couples design-system evolution to auth package releases.  
**Owner:** `overhaul/packages` (split permissions submodule or move permissions next to auth)  
**Coordination:** `overhaul/auth` must not break RBAC export shapes without packages agent alignment.

### H4. Duplicated cross-app utilities

**Where:** e.g. `apps/auth/lib/parse-user-agent.ts` ↔ `apps/studio/src/lib/parseUserAgent.ts`; theme-boot / session-cache / auth handoff parallels  
**What:** Drift risk (security/UX) between Account Center and Studio settings.  
**Owner:** Extract candidates → `overhaul/packages`; call sites → `overhaul/auth` + `overhaul/apps`.  
**Order:** packages first, then auth/apps consumers.

### H5. OpenAPI generator is a root mega-script

**Where:** `scripts/generate-openapi.mjs` (~1509 LOC), output `packages/types/openapi.yaml`  
**What:** Contract ownership is unclear (API routes vs root script vs types package). API does not depend on `@hosanna/types`. Drift between Express validators and OpenAPI is easy.  
**Owner:** Prefer `overhaul/apps` (API truth) + `overhaul/packages` (`types`) with `overhaul/testing` for generation in CI if missing.  
**Fix direction:** Generate from route/zod sources or keep single owner doc; ensure CI fails on stale `openapi.yaml`.

---

## Medium

### M1. Parallel UI systems (SaaS Radix/shadcn vs `@hosanna/ui`)

**Where:** `apps/saas/src/components/ui/*` vs `packages/ui`  
**What:** Marketing site depends on `@hosanna/ui` but also maintains a large local Radix kit. Visual language docs exist separately.  
**Owner:** `overhaul/apps` (saas only). Low urgency unless brand consistency work.

### M2. i18n fragmentation

**Where:** `@hosanna/i18n` + per-app locale trees (`studio`, `saas`, `auth` ui/email, `api` locales, `logos-ai/i18n`, `packages/auth` responsibilities copy)  
**What:** Shared package is a language model, not a single message catalog. Expected for product strings, but naming (`pt` vs `pt-PT`) and duplication of responsibility labels in auth package increase inconsistency.  
**Owner:** `overhaul/packages` for shared keys; apps/auth for app strings.

### M3. Auth deploy path filters incomplete for logos-ai / cache

**Where:** `deploy-auth.yml`  
**What:** Auth app depends on `logos-ai` and transitively cache via `@hosanna/auth`; path filter lists db/brand/config/i18n/ui/auth but not logos-ai/cache.  
**Owner:** `overhaul/testing` / workflows.

### M4. Lint is non-blocking in CI

**Where:** `ci.yml` lint `continue-on-error: true`  
**What:** Documented baseline prettier/hook warnings. Quality agent should not “fix CI green” by enabling fail-closed without apps/auth cleanup.  
**Owner:** `overhaul/quality` cleanup → later `overhaul/testing` to tighten.

### M5. `packages/auth` responsibilities catalogs are product copy

**Where:** `packages/auth/src/responsibilities.ts`  
**What:** Locale-specific worship role labels live in the auth library, not i18n. Unusual layering.  
**Owner:** `overhaul/auth` or move to i18n via packages agent.

### M6. API Prisma dual entry

**Where:** `apps/api/src/database/prisma.ts` and `@hosanna/db`; auth has `apps/auth/lib/prisma.ts`  
**What:** Thin wrappers are fine, but agents should not invent a third client.  
**Owner:** Keep wrappers local; schema only in `packages/db` (`overhaul/packages`).

### M7. Compose stack incomplete vs product surface

**Where:** `docker-compose.yml` — db + api + studio only  
**What:** Auth app (required for full login flows) not orchestrated. Local full-stack dx friction.  
**Owner:** `overhaul/apps` / docs — optional compose service for auth.

---

## Low

### L1. Package private/version inconsistency

**Where:** Some packages omit `"private": true` (`api`, `studio`, `chordpro`); versions mix `0.0.0`, `1.0.0`, `2.24.5`.  
**Owner:** `overhaul/packages` / apps metadata polish.

### L2. README package table incomplete

**Where:** Root `README.md` omits `cache`, `logos-ai`, `replication` from the main table.  
**Owner:** docs update (architect follow-up or quality).

### L3. SaaS has no `test` script

**Where:** `apps/saas/package.json`  
**Owner:** `overhaul/testing`.

### L4. `packages/db` / `types` have no unit tests

**Where:** package scripts  
**Owner:** `overhaul/testing` — schema/contract tests as needed.

### L5. Pre-existing product backlog still open

**Where:** `docs/architecture/improvements.md` — Firestore annotation ACL world-readable (#3); Redis global rate limits nice-to-have.  
**Owner:** Prefer `overhaul/bugs` / security-minded apps work — **not** architecture docs alone.

---

## Health sample (2026-11-11, this worktree)

Ran after `pnpm install --frozen-lockfile` (deps present). Full `pnpm typecheck` / `pnpm test` not completed end-to-end (time); sampled packages:

| Check                                                | Result                                                         |
| ---------------------------------------------------- | -------------------------------------------------------------- |
| `@hosanna/i18n` typecheck                            | pass                                                           |
| `@hosanna/brand` typecheck                           | pass                                                           |
| `@hosanna/cache` typecheck                           | pass                                                           |
| `@hosanna/replication` typecheck                     | pass                                                           |
| `@hosanna/types` typecheck                           | pass                                                           |
| `@hosanna/db` typecheck                              | pass                                                           |
| `@hosanna/auth` typecheck (no prior build)           | **fail** — missing `@hosanna/cache` / `@hosanna/db` dist types |
| `@hosanna/ui` typecheck (no prior auth build)        | **fail** — missing `@hosanna/auth`                             |
| After `cache`+`db`+`auth` build: auth + ui typecheck | pass                                                           |
| `@hosanna/ui` tests (after auth build)               | 9 pass                                                         |
| `@hosanna/i18n` / `cache` / `brand` tests            | pass                                                           |
| `@hosanna/logos-ai` typecheck (no chordpro build)    | **fail** — missing `@hosanna/chordpro`                         |

**Interpretation:** Not necessarily broken tree — turbo `dependsOn: ["^build"]` is load-bearing. Agents must build dist packages (or use root turbo) before isolated filter typechecks. CI path should remain the source of truth for green.

---

## Duplication / extraction opportunities (summary)

| Opportunity                       | Suggested home                                                     | Consumers                   |
| --------------------------------- | ------------------------------------------------------------------ | --------------------------- |
| parseUserAgent                    | `packages/ui` or small `packages/user-agent`                       | auth, studio                |
| theme-boot / handoff helpers      | `packages/auth/client` or brand                                    | auth, studio                |
| session-cache patterns            | stay app-local or auth client helpers                              | auth, studio                |
| Shared Button/Modal already in ui | grow `@hosanna/ui` carefully                                       | studio, auth; saas optional |
| Email templates/service           | split under `apps/auth` (not a shared package unless API needs it) | auth-app                    |

---

## Non-goals for architecture branch

- No application or package source rewrites in `overhaul/architect`.
- No merge to `develop`, no push from this agent unless later instructed.
