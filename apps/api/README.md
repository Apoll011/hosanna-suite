# Hosanna Studio Backend

> Part of the **hosanna-suite** monorepo (`apps/api`). Prisma lives in `@hosanna/db`. MCP docs stay in `docs/mcp/` (shipped with the build). See the [root README](../../README.md).

Production REST API for Hosanna Studio and the Flutter musician app: songs,
folders, collections, worship services, agenda, replication sync, AI, and MCP.
Backed by PostgreSQL (Supabase) via Prisma. Auth is **Better Auth** (cookies +
Bearer), not legacy JWT admin tokens.

This project is API-only — no frontend assets are served. Studio
(`studio.hosanna.live`) and the Flutter app talk to this server over HTTP.

## Architecture

End-to-end system docs (Studio, Flutter, marketing, sync, auth, integrations):

- **[Architecture docs](../../docs/architecture/README.md)** — index
- [System overview](../../docs/architecture/system-overview.md)
- [Mermaid diagrams](../../docs/architecture/diagram.md)
- [Clients](../../docs/architecture/clients.md) · [Backend internals](../../docs/architecture/backend-internals.md)
- [Data & sync](../../docs/architecture/data-and-sync.md) · [Auth & billing](../../docs/architecture/auth-and-billing.md)
- [External integrations](../../docs/architecture/external-integrations.md)
- [Improvements / TODOs / bugs](../../docs/architecture/improvements.md)
- [Deploy report (Vercel / Cloudflare)](../../docs/architecture/deploy-report.md)

## Stack

Node.js, TypeScript, Express, Prisma ORM, PostgreSQL, Zod, Better Auth,
Stripe, `@hosanna/chordpro`, Model Context Protocol (`@modelcontextprotocol/server`).

## MCP server

Hosanna exposes an MCP interface for AI clients (songs, services, ChordPro):

- **HTTP:** `POST /mcp` (Streamable HTTP). Auth is optional for ChordPro tools; song/service tools need an org context.
- **OAuth 2.1:** Better Auth MCP plugin — clients discover `/.well-known/oauth-protected-resource[/mcp]` (and AS metadata), then authorize via Studio (`STUDIO_URL/login` → `/oauth/consent`). Set `MCP_RESOURCE_URL` to the exact public `/mcp` URL clients use (audience binding). Session Bearer tokens still work. Claude / ChatGPT / Cursor need DCR (`allowDynamicClientRegistration`) plus CORS/trustedOrigins for their hosts.
- **Propagate chords:** `chordpro.propagate_chords` copies `[Am]` / `[G]` / … from the first chorded verse onto later verses at the same lyric offsets (does not invent chords).
- **stdio:** `HOSANNA_BEARER_TOKEN=<token> npm run mcp`

Resources live under `hosanna://…` (guide, schemas, skills). Task prompts include `songs.*` and `services.*`. Workflow skills are in `docs/mcp/skills/` and also served as MCP resources.

## Project layout

```
src/
  config/          env loading
  database/        Prisma client singleton
  lib/             Better Auth, email, i18n, …
  middleware/      auth guards, Zod validation, error handler, subscription
  mcp/             MCP tools, resources, prompts (HTTP + stdio)
  repositories/    Prisma data-access layer
  routes/          Express routers
  services/        business logic
  validators/      Zod schemas
  utils/
  types/
  index.mts        app entrypoint
../../docs/mcp/          ChordPro guide, domain docs, and AI workflow skills
                   (copied to dist/mcp/docs on build for Vercel/Docker)
```

The Prisma schema, migrations, and generated client live in the
[`@hosanna/db`](../../packages/db) workspace package. RBAC statements and roles
live in [`@hosanna/auth`](../../packages/auth).

## Running with Docker (recommended)

```bash
cp .env.example .env
# edit .env — see Environment variables below
docker compose --env-file .env up --build
```

This starts Postgres + the API on `http://localhost:3000`. The container's
entrypoint runs `prisma migrate deploy` automatically before booting.

## Running locally (without Docker)

```bash
pnpm install                       # from the monorepo root; also runs prisma generate
cp .env.example .env               # fill required vars from .env.example
cp ../../packages/db/.env.example ../../packages/db/.env   # DATABASE_URL / DIRECT_URL for the Prisma CLI
pnpm run prisma:migrate
pnpm run dev                       # tsx watch, http://localhost:3000
```

## Environment variables

See **`.env.example`** for the full list. Required at process start (`src/config/env.ts`):

| Variable                                      | Purpose                                   |
| --------------------------------------------- | ----------------------------------------- |
| `DATABASE_URL`                                | Postgres (prefer Supabase pooler `:6543`) |
| `BETTER_AUTH_SECRET`                          | Session signing (`openssl rand -hex 32`)  |
| `PUBLIC_APP_URL`                              | Public API origin (auth issuer base)      |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`   | Google OAuth                              |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Org billing                               |
| `TURNSTILE_SECRET_KEY`                        | Cloudflare Turnstile                      |
| `SUPABASE_URL` / `SUPABASE_SECRET_KEY`        | Avatars + Supabase client                 |
| `RESEND_API_KEY`                              | Transactional email                       |

Important optional: `STUDIO_URL`, `MCP_RESOURCE_URL`, `CRON_SECRET`, `FCM_*`,
`AI_SETTINGS_ENCRYPTION_KEY`, `YOUTUBE_API_KEY`, `CORS_ORIGIN`,
`RATE_LIMIT_DISABLED`, `DIRECT_URL` (migrations).

For live note pings and **song annotation sync**, set `FCM_PROJECT_ID`,
`FCM_CLIENT_EMAIL`, and `FCM_PRIVATE_KEY`, enable Firestore, and deploy
`firestore.rules` (see
[docs/ANNOTATIONS_FIREBASE.md](../../docs/ANNOTATIONS_FIREBASE.md)). Firebase Storage
is not required.

## Scripts

- `pnpm run dev` — watch mode (tsx)
- `pnpm run build` / `pnpm start` — compile to `dist/` and run
- `pnpm test` — unit / contract tests
- `pnpm run prisma:migrate:dev` — create/apply a migration in development
- `pnpm run prisma:migrate` — apply pending migrations (production)
- `pnpm run typecheck` — `tsc --noEmit`
