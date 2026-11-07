# Hosanna Suite

pnpm + Turborepo monorepo for the Hosanna web platform:

| Path | Package | Role |
| --- | --- | --- |
| `apps/saas` | `@hosanna/saas` | Marketing site ([hosanna.live](https://hosanna.live)) |
| `apps/studio` | `@hosanna/studio` | Studio PWA ([studio.hosanna.live](https://studio.hosanna.live)) |
| `apps/api` | `@hosanna/api` | REST + MCP API ([api.hosanna.live](https://api.hosanna.live)) |
| `packages/chordpro` | `@hosanna/chordpro` | ChordPro parser / renderer / editor |
| `packages/db` | `@hosanna/db` | Prisma schema, migrations, client |
| `packages/auth` | `@hosanna/auth` | Shared Better Auth RBAC statements & roles |
| `packages/types` | `@hosanna/types` | OpenAPI contract + generated TS types |
| `packages/i18n` | `@hosanna/i18n` | Shared UI language model |
| `packages/ui` | `@hosanna/ui` | Shared `cn()` + provider icons |
| `packages/brand` | `@hosanna/brand` | Shared favicon / apple-touch / OG assets |
| `packages/config` | `@hosanna/config` | Shared tsconfig + Prettier |

**Not in this repo:** the Flutter musician app and the Astro blog — those stay separate.

## Requirements

- Node.js **24+**
- [pnpm](https://pnpm.io) **11.24** (via Corepack: `corepack enable`)
- Optional: Docker + Compose for local Postgres / full stack

## Quick start

```bash
pnpm install
cp apps/api/.env.example apps/api/.env   # fill secrets
cp packages/db/.env.example packages/db/.env
# copy DATABASE_URL / DIRECT_URL into packages/db/.env for the Prisma CLI

pnpm db:generate
pnpm db:migrate                          # or db:migrate:dev while iterating

pnpm --filter @hosanna/api dev           # http://localhost:3000
pnpm --filter @hosanna/studio dev        # http://localhost:5173 (or next free)
pnpm --filter @hosanna/saas dev          # marketing site
```

All apps together (after packages have been built once):

```bash
pnpm dev
```

## Common scripts

| Command | What it does |
| --- | --- |
| `pnpm build` | `turbo run build` across the workspace |
| `pnpm typecheck` | Clean typecheck |
| `pnpm test` | Package + API unit/contract tests |
| `pnpm lint` | ESLint (apps still have a baseline of prettier/hook warnings) |
| `pnpm db:generate` | Prisma client |
| `pnpm db:migrate` | `prisma migrate deploy` |
| `pnpm db:migrate:dev` | Create/apply a migration in development |
| `pnpm docker:up` | Build & start Postgres + API + Studio |
| `pnpm docker:down` | Stop the stack |

## Docker (db + api + studio)

```bash
# Minimal: copy apps/api/.env and set the Better Auth / Stripe / etc. secrets.
# Compose overrides DATABASE_URL to point at the local Postgres service.
pnpm docker:up

# API  → http://localhost:3000
# Studio (nginx) → http://localhost:8080
# Postgres → localhost:5432 (user/pass/db: hosanna)
```

Images are defined in the root `Dockerfile` (`api` and `studio` targets) and orchestrated by `docker-compose.yml`.

## Shared brand assets

Favicon, apple-touch icons, and OG image live in `packages/brand/public` (sourced from the former saas assets).  
Each app keeps only its own `robots.txt`, `sitemap.xml`, and `_routes.json` under `apps/*/public`.  
Vite picks up the shared files via `@hosanna/brand/vite-plugin`.

## Docs

- [docs/](./docs/README.md) — architecture, Firebase annotations, visual language, future direction
- MCP tool docs stay under [`apps/api/docs/mcp`](./apps/api/docs/mcp/README.md) (they ship with the API build)

## Git history

This repo was assembled with `git subtree add` (no `--squash`) from the original saas / studio / server / chordpro repositories.  
Commits, authors, and timestamps from those projects are part of this history. There are **no git submodules** and **no object alternates** — the suite is a normal standalone repository. The original folders under `Hosanna/` can be archived or deleted once you are happy with this remote.

## Deploy notes

- Point Vercel / Cloudflare project **root directories** at `apps/saas`, `apps/studio`, or `apps/api` (or run filtered turbo builds from the monorepo root).
- Prisma migrations: `pnpm db:migrate` (or the API Docker entrypoint, which runs migrate before boot).
- Chordpro npm publish: GitHub release tags starting with `chordpro-v` / `@hosanna/chordpro@` trigger [`.github/workflows/publish-chordpro.yml`](./.github/workflows/publish-chordpro.yml).
