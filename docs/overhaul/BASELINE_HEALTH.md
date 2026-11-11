# Baseline health — `overhaul/testing`

Recorded **2026-11-11** on branch `overhaul/testing` after `pnpm install --frozen-lockfile`.

Environment: Node `v24.22.1` (local runner also had nvm `v26` on PATH for some pnpm child processes), pnpm `11.24.0`, turbo `2.11.10`.

## Command results

| Command                          | Result   | Notes                                                                |
| -------------------------------- | -------- | -------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile` | **PASS** | Prisma client generated via `@hosanna/db` postinstall                |
| `pnpm typecheck`                 | **PASS** | 19/19 turbo tasks                                                    |
| `pnpm lint` (before fix)         | **FAIL** | `@hosanna/studio#lint` — 845 auto-fixable `prettier/prettier` errors |
| `pnpm lint` (after fix)          | **PASS** | 8/8 turbo tasks (`auth-app`, `saas`, `studio` + deps)                |
| `pnpm test` (`NODE_ENV=test`)    | **PASS** | 16/16 turbo tasks · **413** unit tests · 0 failures                  |
| `pnpm build`                     | **PASS** | 9/9 turbo tasks                                                      |
| `pnpm test:workspace`            | **PASS** | New infra smoke (4 checks)                                           |

### Per-package unit tests (`pnpm test`)

| Package                |    Pass |  Fail |
| ---------------------- | ------: | ----: |
| `@hosanna/api`         |     117 |     0 |
| `@hosanna/chordpro`    |      84 |     0 |
| `@hosanna/auth-app`    |      63 |     0 |
| `@hosanna/studio`      |      52 |     0 |
| `@hosanna/auth`        |      26 |     0 |
| `@hosanna/logos-ai`    |      26 |     0 |
| `@hosanna/i18n`        |      16 |     0 |
| `@hosanna/replication` |      10 |     0 |
| `@hosanna/ui`          |       9 |     0 |
| `@hosanna/brand`       |       5 |     0 |
| `@hosanna/cache`       |       5 |     0 |
| **Total**              | **413** | **0** |

Packages with **no** `test` script: `@hosanna/saas`, `@hosanna/config`, `@hosanna/db`, `@hosanna/types`.

Packages with **no** `lint` script: all packages under `packages/*` plus `@hosanna/api` (only apps `auth`, `saas`, `studio` lint today).

## Script / CI inventory

### Root scripts (`package.json`)

| Script                                                    | Purpose                                                              |
| --------------------------------------------------------- | -------------------------------------------------------------------- |
| `dev` / `build` / `typecheck` / `lint` / `test` / `clean` | Turbo task runners                                                   |
| `test:workspace`                                          | Infra smoke: pnpm/CI version lock, turbo tasks, test-script coverage |
| `format` / `fix*`                                         | Prettier + eslint autofix helpers                                    |
| `docker:*`                                                | Compose up/down                                                      |
| `db:*`                                                    | Proxied to `@hosanna/db` Prisma                                      |
| `openapi:generate`                                        | Regenerates OpenAPI + `@hosanna/types`                               |

### Turbo (`turbo.json`)

Tasks: `build`, `db:generate`, `typecheck`, `lint`, `test`, `dev`, `clean`, `format`, `fix`.

`typecheck` / `test` / `dev` depend on `^build` and `db:generate`. `lint` depends on `^build`.

### CI workflows (`.github/workflows`)

| Workflow                                                     | Role                                                                        |
| ------------------------------------------------------------ | --------------------------------------------------------------------------- |
| `ci.yml`                                                     | Install → workspace health → typecheck → **lint (blocking)** → build → test |
| `deploy-auth.yml`                                            | Auth app deploy                                                             |
| `deploy-saas.yml`                                            | SaaS deploy                                                                 |
| `deploy-studio-preview.yml` / `deploy-studio-production.yml` | Studio Cloudflare deploys                                                   |
| `publish-chordpro.yml`                                       | ChordPro package publish                                                    |

### Workspace layout

- Apps: `api`, `auth`, `saas`, `studio`
- Packages: `auth`, `brand`, `cache`, `chordpro`, `config`, `db`, `i18n`, `logos-ai`, `replication`, `types`, `ui`
- Shared config: `packages/config` (tsconfig base/node/vite + prettier). ESLint remains **per-app** (three different flat configs).

## Known non-blocking noise

- `@hosanna/auth-app` build logs Better Auth / Prisma `EAI_AGAIN` when no DB is reachable during static generation; build still exits 0.
- SaaS `prerender.mjs` rewrites `apps/saas/public/sitemap.xml` `lastmod` dates on every build (do not treat as a functional failure).

## Gaps (honest, not silenced)

1. Lint coverage is app-only; shared packages and `api` are not eslint-gated.
2. `@hosanna/saas` has no unit test suite.
3. ESLint configs are inconsistent across apps (studio uses Prettier-as-error; auth does not).
4. Prettier drift in studio locales was large enough that CI previously used `continue-on-error: true` for lint — that suppression is removed on this branch after autofix.
