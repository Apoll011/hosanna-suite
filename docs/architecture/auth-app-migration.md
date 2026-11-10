# Auth app migration

Hosanna Auth (`apps/auth`, `auth.hosanna.live`) hosts Better Auth **and** the auth UI (login, onboarding, MCP consent, account center). The API remains a resource server that validates sessions via the shared `createAuth()` factory in `@hosanna/auth/server`.

## Cutover checklist

1. **DNS** — `auth.hosanna.live` / `dev-auth.hosanna.live` → Vercel project for `apps/auth`.
2. **Env (auth app)** — copy Better Auth / Google / Stripe / Turnstile / Resend / Supabase / `DATABASE_URL` from API; set `AUTH_URL` + `NEXT_PUBLIC_AUTH_URL` to the auth origin; `STUDIO_URL` / `MCP_RESOURCE_URL` as today.
3. **Google OAuth** — add redirect URI `https://auth.hosanna.live/api/auth/callback/google` (and dev).
4. **Stripe** — point webhook endpoint at `https://auth.hosanna.live/api/auth/stripe/webhook` (or the Better Auth Stripe path in use).
5. **Turnstile** — allow hostname `auth.hosanna.live`.
6. **API** — set `AUTH_URL=https://auth.hosanna.live` (issuer/JWKS only; auth HTTP is not mounted on the API).
7. **Studio** — `VITE_AUTH_URL=https://auth.hosanna.live`.
8. **SaaS** — `VITE_DASHBOARD_URL=https://auth.hosanna.live`.
9. **Flutter** — `--dart-define=HOSANNA_AUTH_URL=https://auth.hosanna.live` and captcha URL on the auth host.
10. **Cookies** — keep `crossSubDomainCookies.domain=hosanna.live` (already in `createAuth`).

## Shared package

- `@hosanna/auth` — RBAC + `createAuth` + `withOauthNavigationRedirect` + `createHosannaAuthClient`
- API and auth app both call `createAuth` against the same Postgres.
