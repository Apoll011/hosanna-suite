# Hosanna Suite — Architecture Map

> Audit baseline: `e779c38` (`develop` HEAD when overhaul swarm started).  
> Scope: monorepo structure, workspace graph, turbo/CI — no application rewrites.

## 1. Top-level layout

```
hosanna-suite/
├── apps/
│   ├── api/          @hosanna/api        Express REST + MCP (api.hosanna.live)
│   ├── auth/         @hosanna/auth-app   Next.js Better Auth host (auth.hosanna.live)
│   ├── saas/         @hosanna/saas       Vite marketing site (hosanna.live)
│   └── studio/       @hosanna/studio     Vite+Preact PWA (studio.hosanna.live)
├── packages/
│   ├── auth/         @hosanna/auth       createAuth factory, RBAC, client helpers
│   ├── brand/        @hosanna/brand      Shared favicon / OG assets + sync plugins
│   ├── cache/        @hosanna/cache      Redis/Upstash cache helpers
│   ├── chordpro/     @hosanna/chordpro   Parser / renderer / editor (publishable)
│   ├── config/       @hosanna/config     Shared tsconfig + Prettier
│   ├── db/           @hosanna/db         Prisma schema, migrations, client
│   ├── i18n/         @hosanna/i18n       Shared language model + message merge
│   ├── logos-ai/     @hosanna/logos-ai   Logos AI UI/runtime (host adapters)
│   ├── replication/  @hosanna/replication Offline sync engine (client-side)
│   ├── types/        @hosanna/types      OpenAPI YAML + generated TS types
│   └── ui/           @hosanna/ui         Shared primitives + permissions hooks
├── scripts/          OpenAPI generator, Tailwind autofix
├── docker/           nginx for Studio image
├── docs/             Product/architecture docs (+ this overhaul/ folder)
├── .github/workflows CI + deploy + chordpro publish
├── Dockerfile        multi-stage api + studio
├── docker-compose.yml Postgres + api + studio
├── package.json      Root scripts (turbo, db, openapi, docker)
├── pnpm-workspace.yaml apps/* + packages/*
└── turbo.json        build / typecheck / lint / test / dev task graph
```

**Outside this repo:** Flutter musician app, Astro blog.

## 2. Runtime topology

```
                    ┌─────────────┐
  hosanna.live ────►│  apps/saas  │  (static / marketing; no DB)
                    └─────────────┘

                    ┌─────────────┐     cookie SSO      ┌──────────────────┐
studio.hosanna.live►│ apps/studio │◄───────────────────►│   apps/auth      │
                    │ Preact PWA  │                     │ Next + Better    │
                    │ RxDB local  │                     │ Auth + Account   │
                    └──────┬──────┘                     └────────┬─────────┘
                           │ REST / replication                  │ createAuth()
                           │                                     │ shared Prisma
                    ┌──────▼──────┐                     ┌────────▼─────────┐
  api.hosanna.live ►│  apps/api   │◄── JWKS / session ──┤ packages/auth    │
                    │ Express+MCP │                     │ packages/db      │
                    └──────┬──────┘                     └──────────────────┘
                           │
                     Postgres (+ Stripe / Supabase / Firebase / Redis / AI)
```

Mental model (from existing `docs/architecture/`): Studio (and Flutter) are **local-first**; API is the sync/resource server; Auth owns the Better Auth HTTP surface; SaaS is marketing-only.

## 3. Package dependency graph (`workspace:*`)

Edges = declared `@hosanna/*` workspace dependencies (runtime or peer/dev).

```
                    ┌──────────────┐
                    │ @hosanna/    │
                    │   config     │  (tsconfig/prettier — almost everything)
                    └──────▲───────┘
                           │
     ┌─────────┬───────────┼───────────┬──────────┬─────────┐
     │         │           │           │          │         │
┌────┴───┐ ┌───┴────┐ ┌────┴────┐ ┌────┴───┐ ┌───┴────┐ ┌─┴──────┐
│  brand │ │  i18n  │ │   db    │ │ cache  │ │chordpro│ │ types  │
└────▲───┘ └───▲────┘ └────▲────┘ └────▲───┘ └───▲────┘ └──▲─────┘
     │         │           │           │         │         │
     │         │      ┌────┴───────────┴──┐      │         │
     │         │      │   @hosanna/auth   │      │         │
     │         │      └────▲──────────────┘      │         │
     │         │           │                     │         │
     │         │      ┌────┴────┐                │         │
     │         │      │   ui    │◄── peer auth   │         │
     │         │      └────▲────┘                │         │
     │         │           │                     │         │
     │         │      ┌────┴─────────────────────┴──┐      │
     │         │      │      logos-ai               │      │
     │         │      │  (chordpro + i18n + ui)     │      │
     │         │      └────▲────────────────────────┘      │
     │         │           │                               │
┌────┴─────────┴───────────┴───────────────────────────────┴──┐
│                         APPS                                 │
│  api ── auth, cache, chordpro, db                            │
│  auth-app ── auth, brand, db, i18n, logos-ai, ui             │
│  studio ── auth, chordpro, i18n, logos-ai, replication,      │
│            ui, brand, types                                  │
│  saas ── i18n, ui, brand                                     │
└──────────────────────────────────────────────────────────────┘
```

### Also: `@hosanna/replication`

Leaf package (config only). Consumed by **studio** for offline sync. Not in Docker studio-build COPY list today (see FINDINGS).

### Layering summary

| Layer       | Packages                                                                     | Notes                                            |
| ----------- | ---------------------------------------------------------------------------- | ------------------------------------------------ |
| Foundations | `config`, `brand`, `i18n`, `types`, `chordpro`, `cache`, `db`, `replication` | Mostly acyclic                                   |
| Auth core   | `auth` → `db`, `cache`                                                       | Dist-built; used by api + auth-app + studio + ui |
| UI kit      | `ui` → peer `auth`                                                           | Permissions hooks import RBAC from auth          |
| Product AI  | `logos-ai` → `chordpro`, `i18n`, `ui`                                        | Source-exported React package                    |
| Apps        | api, auth-app, studio, saas                                                  | Composition roots                                |

## 4. Build / consume modes (inconsistency)

| Package                                       | Consume mode                             | Has `build` script       |
| --------------------------------------------- | ---------------------------------------- | ------------------------ |
| auth, cache, chordpro, db                     | **dist** (`tsc` → `dist/`)               | yes                      |
| brand, i18n, logos-ai, replication, types, ui | **src-direct** (exports point at `src/`) | no (except brand assets) |
| config                                        | JSON assets                              | no                       |

Implication: typecheck/test of consumers that import dist packages **require `^build` first**. Turbo encodes this (`typecheck.dependsOn: ["^build", ...]`). Running `pnpm --filter X typecheck` in isolation fails until deps are built (observed for `@hosanna/ui` → `@hosanna/auth`, `@hosanna/auth` → `@hosanna/cache`/`db`, `@hosanna/logos-ai` → `@hosanna/chordpro`).

## 5. Apps — responsibility map

### `apps/api` (`@hosanna/api`) — Express + MCP

- ~123 TS files under `src/`: routes, services, repositories, validators, middleware, MCP tools/resources/prompts.
- Owns domain write path (songs, folders, services, replication, AI chat/billing, backup, FCM/Firestore helpers).
- Uses `@hosanna/auth` as **resource server** (session/JWKS), not the browser auth UI.
- OpenAPI: root script `scripts/generate-openapi.mjs` (~1500 LOC) → `packages/types/openapi.yaml` → `openapi-typescript`. API package does **not** depend on `@hosanna/types` (generator lives at root; Studio consumes types).
- Locales duplicated under `apps/api/src/locales/` (en/es/pt-PT) — separate from `@hosanna/i18n`.

### `apps/auth` (`@hosanna/auth-app`) — Next.js 15 Auth host

- Better Auth HTTP + Account Center + org settings + MCP consent.
- Wires `createAuth()` from `@hosanna/auth/server` with Prisma, Stripe, email callbacks, Supabase avatars.
- **Known pain point — flat `apps/auth/lib/`:** 23 modules, ~3.1k LOC total; `email.service.ts` alone is **1208** lines. Mixes env, prisma, caches, API clients, theme, UA parsing, handoff, and a monolith email service in one directory with no subdomain folders.
- Also: `components/`, `hooks/`, `locales/` (email + UI), App Router pages under `app/`.
- Frameworks: Next 15, React 19, Better Auth, Stripe, Resend, Supabase, Prisma.

### `apps/studio` (`@hosanna/studio`) — Vite + Preact PWA

- ~238 TS/TSX files: local RxDB, replication, API client, pages, Logos host, analytics.
- React aliases via `@preact/compat`. Deploy: Cloudflare (wrangler) + Docker/nginx image.
- Duplicates some auth-app utilities (e.g. `parseUserAgent`, session/theme handoff patterns).

### `apps/saas` (`@hosanna/saas`) — Vite marketing

- Thin (~33 TS/TSX). TanStack Router + large Radix set + local `components/ui` (shadcn-style) **parallel** to `@hosanna/ui`.
- No `@hosanna/auth` / db / api coupling. Deploy: Vercel/Cloudflare path filters.

## 6. Turbo (`turbo.json`)

| Task                         | dependsOn                               | Notes                                                      |
| ---------------------------- | --------------------------------------- | ---------------------------------------------------------- |
| `build`                      | `^build`, `^db:generate`, `db:generate` | Large `env` allowlist (VITE__, BETTER_AUTH__, STRIPE_*, …) |
| `typecheck` / `test` / `dev` | same as build for generate + `^build`   | Correct for dist packages                                  |
| `lint`                       | `^build`                                | CI runs with `continue-on-error`                           |
| `db:generate`                | —                                       | `cache: false`                                             |

Root scripts: `dev|build|typecheck|lint|test|clean|format|fix*`, `db:*`, `openapi:generate`, `docker:*`.

## 7. CI / deploy

| Workflow               | Trigger                                            | Action                                                                                                       |
| ---------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `ci.yml`               | push `main`/`develop`, PRs                         | install → typecheck → build → test; lint report-only                                                         |
| `deploy-auth.yml`      | main + path filters                                | auth + auth/db/brand/config/i18n/ui                                                                          |
| `deploy-saas.yml`      | main + path filters                                | saas + brand/config/i18n/ui                                                                                  |
| `deploy-studio-*.yml`  | develop (preview) / main (prod)                    | studio + auth/brand/chordpro/config/i18n/types/ui — **missing** logos-ai, replication, cache in path filters |
| `publish-chordpro.yml` | release tags `chordpro-v*` / `@hosanna/chordpro@*` | npm publish                                                                                                  |

Docker `Dockerfile`:

- **api-build** copies config/auth/db/chordpro/types/api — not cache (but api depends on `@hosanna/cache`; may rely on install graph — verify on image rebuild).
- **studio-build** copies config/auth/chordpro/types/i18n/ui/brand/studio — **omits** `logos-ai` and `replication` despite studio `package.json` deps.

Compose: Postgres 16 + api + studio nginx. Auth/saas not in compose.

## 8. Scripts

| Script                         | Role                                                       |
| ------------------------------ | ---------------------------------------------------------- |
| `scripts/generate-openapi.mjs` | Large hand-maintained OpenAPI assembler → `packages/types` |
| `scripts/fix-tailwind.mjs`     | Canonical Tailwind class autofix via language server       |
| `scripts/openapi.md`           | Notes for generator                                        |

## 9. Existing docs (do not replace)

`docs/architecture/` already covers system overview, sync, auth/billing, integrations, deploy, and an improvements backlog (e.g. Firestore annotation ACL still open). This overhaul folder is the **monorepo structure audit** for parallel agent work — product-domain details stay in `docs/architecture/`.

## 10. Recommended implementation order (for other overhaul branches)

1. **architect** (this) — land map + ownership so others align.
2. **packages** — stabilize shared package contracts/builds (especially dist vs src, Docker COPY lists, deploy path filters, `ui`↔`auth` layering).
3. **auth** — restructure `apps/auth/lib`, keep `packages/auth` API stable; split email/service boundaries.
4. **apps** — studio/api/saas alignment after shared packages settle (duplication, Docker, local UI vs `@hosanna/ui`).
5. **bugs** — real fixes preferring areas not mid-refactor.
6. **quality** — comment/dead-code sweeps after structural moves.
7. **testing** — CI/turbo/root tooling and coverage once trees stabilize.

See `COORDINATION.md` for file ownership and merge rules.
