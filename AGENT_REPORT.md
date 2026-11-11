# Agent 4 — Authentication & Security Specialist

**Worktree:** `/home/apoll011/coding/Hosanna/suite-worktrees/auth`  
**Branch:** `overhaul/auth`  
**Scope:** `apps/auth`, `packages/auth` only  
**Date:** 2026-11-11

## Summary

Reorganized the flat `apps/auth/lib/` dump into responsibility-based modules and mirrored that structure inside `packages/auth/src/` without changing public package export paths (`@hosanna/auth`, `@hosanna/auth/server`, `@hosanna/auth/client`). All consumer imports in `apps/auth` were updated to the new paths (no compatibility shims). Deduplicated duplicated localStorage helpers. No secrets changes, no DB migrations/destructive ops, no auth/authorization guarantee changes.

## Reorg map — `apps/auth/lib`

| Old path | New path |
|---|---|
| `lib/auth.ts` | `lib/auth/server.ts` |
| `lib/auth-client.ts` | `lib/auth/client.ts` |
| `lib/captcha.ts` | `lib/auth/captcha.ts` |
| `lib/redirect.ts` | `lib/auth/redirect.ts` |
| `lib/studioHandoff.ts` | `lib/auth/studio-handoff.ts` |
| `lib/session-cache.ts` | `lib/session/cache.ts` |
| `lib/org-cache.ts` | `lib/organization/cache.ts` |
| `lib/org-ui.ts` | `lib/organization/ui.ts` |
| `lib/env.ts` | `lib/config/env.ts` |
| `lib/prisma.ts` | `lib/db/prisma.ts` |
| `lib/supabase.ts` | `lib/db/supabase.ts` |
| `lib/email.service.ts` | `lib/services/email.ts` |
| `lib/resend.ts` | `lib/services/resend.ts` |
| `lib/hosanna-api.ts` | `lib/services/api.ts` |
| `lib/ai-api.ts` | `lib/services/ai-api.ts` |
| `lib/ai-settings-cache.ts` | `lib/services/ai-settings-cache.ts` |
| `lib/backup-api.ts` | `lib/services/backup-api.ts` |
| `lib/notifications-api.ts` | `lib/services/notifications-api.ts` |
| `lib/parse-user-agent.ts` | `lib/account/parse-user-agent.ts` |
| `lib/compress-image.ts` | `lib/account/compress-image.ts` |
| `lib/i18n.tsx` | `lib/ui/i18n.tsx` |
| `lib/theme.tsx` | `lib/ui/theme.tsx` |
| `lib/theme-boot.ts` | `lib/ui/theme-boot.ts` |
| *(new)* | `lib/utils/local-storage.ts` (shared by session + org caches) |

Module intent:

- **auth/** — Better Auth server instance, browser client, captcha headers, post-login redirects, Studio handoff
- **session/** — account-center client cache (user/sessions/accounts/login history)
- **organization/** — active-org cache + org UI helpers
- **config/** — env validation
- **db/** — Prisma + Supabase avatar storage
- **services/** — email/Resend + Hosanna API clients (AI, backup, notifications)
- **account/** — account UX helpers (UA parse, image compress)
- **ui/** — theme + i18n providers
- **utils/** — shared browser storage helpers

## Reorg map — `packages/auth/src`

| Old path | New path |
|---|---|
| `src/permission.ts` | `src/authorization/permission.ts` |
| `src/roles.ts` | `src/authorization/roles.ts` |
| `src/responsibilities.ts` | `src/authorization/responsibilities.ts` |
| `src/cors.ts` | `src/http/cors.ts` |
| `src/oauth-navigation-redirect.ts` | `src/http/oauth-navigation-redirect.ts` |
| `src/plugin-locale-overrides.ts` | `src/i18n/plugin-locale-overrides.ts` |
| `src/client.ts` | unchanged (public `./client` entry) |
| `src/index.ts` | unchanged export surface; re-exports from new modules |
| `src/server/*` | unchanged public `./server` entry; internal imports updated |

Public package exports (`"."`, `"./server"`, `"./client"`) remain compatible for Studio/API/UI consumers.

## Security review notes

Reviewed without weakening guarantees:

1. **Session cookies (packages/auth `createAuth`)** — `sameSite: "none"`, `secure: true`, `httpOnly: true`, cross-subdomain `hosanna.live`, cookie cache JWE. Unchanged.
2. **CORS (`http/cors.ts`)** — credentialed ACAO only for trusted origins (hosanna.live + localhost + known MCP hosts). Unchanged allowlist semantics.
3. **OAuth navigation shim** — still converts JSON `{redirect,url}` → 302 for document navigations / authorize GET only; fetch/cors keeps JSON. Unchanged.
4. **Redirect safety (`auth/redirect.ts`)** — `isSafeRedirectTarget` still rejects protocol-relative / non-http(s). Used for `redirect`/`returnUrl` and social callbacks. Unchanged.
5. **Captcha** — still attaches `x-captcha-response` only when a token exists; required only when Turnstile is configured. Unchanged.
6. **Env secrets** — `BETTER_AUTH_SECRET`, Stripe, Google, Supabase, Resend, Turnstile still required at runtime; build-time placeholders via `SKIP_ENV_VALIDATION` / Next production-build phase only. Unchanged.
7. **API session org sync (`services/api.ts`)** — still `credentials: "include"` and syncs `organization.setActive` before org-scoped API calls. Unchanged.

### Residual risk (pre-existing; not changed)

- **Session tokens in `localStorage`** via `session/cache` (`CachedSessionRow.token`) for Active Sessions revoke UX. XSS on the auth origin could read cached session tokens. Hardening (omit tokens from cache; revoke only from in-memory network data) would be a follow-up; intentionally behavior-preserving here.

## Unused / dedupe

- Deduped identical `canUseStorage` / `readJson` / `writeJson` / `removeKey` from session + org caches into `lib/utils/local-storage.ts`.
- No unused auth modules removed: every moved file still has live consumers (verified via import graph + tests).

## Verification

```text
pnpm --filter @hosanna/cache build
pnpm --filter @hosanna/db build
pnpm --filter @hosanna/auth typecheck   # pass
pnpm --filter @hosanna/auth test        # 26 pass
pnpm --filter @hosanna/auth build       # pass
SKIP_ENV_VALIDATION=true pnpm --filter @hosanna/auth-app typecheck  # pass
SKIP_ENV_VALIDATION=true pnpm --filter @hosanna/auth-app test       # 63 pass
```

Did **not** run full `next build` (hung / heavy in this worktree); `tsc --noEmit` covers import resolution for the reorg.

## Out of scope / not done

- No merge to `develop`
- No push
- No changes outside `apps/auth` / `packages/auth` (except install-generated `node_modules` / workspace dist for verification)
- No secret or cookie-policy changes
