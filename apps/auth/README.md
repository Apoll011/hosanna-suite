# @hosanna/auth-app

Next.js App Router app for **auth.hosanna.live** — Better Auth server + auth UI (login, onboarding, MCP consent, account center).

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 (Hosanna sky/cyan tokens)
- Shared `createAuth()` from `@hosanna/auth/server`

## Develop

```bash
# from suite/
cp apps/auth/.env.example apps/auth/.env   # reuse API secrets; set AUTH_URL=http://localhost:5174
pnpm install
pnpm --filter @hosanna/auth build
pnpm --filter @hosanna/auth-app dev        # http://localhost:5174
```

Point Studio at the auth app:

```bash
# apps/studio/.env
VITE_AUTH_URL=http://localhost:5174
```

Point API issuer / deep links (optional local dual-run):

```bash
# apps/api/.env
AUTH_URL=http://localhost:5174
```

## Routes

Public: `/login`, `/register`, `/new`, `/forgot-password`, `/reset-password`, `/verify-email`, `/two-factor`, `/auth/error`, `/accept-invitation`, `/captcha`

Authenticated: `/onboarding`, `/oauth/consent`, `/account`

API: `/api/auth/*` + `/.well-known/*`

## Deploy

Vercel project rooted at `apps/auth` (see `.github/workflows/deploy-auth.yml`). Domain: `auth.hosanna.live`.

Cutover notes: [docs/architecture/auth-app-migration.md](../../docs/architecture/auth-app-migration.md).
