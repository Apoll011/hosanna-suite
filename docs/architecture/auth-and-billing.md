# Auth, RBAC, and billing

## Better Auth

Shared factory: `createAuth()` in `@hosanna/auth/server`.  
**HTTP + UI:** `apps/auth` (`auth.hosanna.live`).  
**Session validation:** `apps/api` imports the same factory (resource server).  
See [auth-app-migration.md](./auth-app-migration.md).

### Sign-in methods

- Email / password (min 8; reset + welcome emails via Resend)
- Google OAuth (`GOOGLE_CLIENT_ID` / `SECRET`)
- Captcha: Cloudflare Turnstile
- Optional 2FA (email OTP)
- HaveIBeenPwned + Better Auth Infra **sentinel**

### Session transport

| Mechanism                                                   | Used by                           |
| ----------------------------------------------------------- | --------------------------------- |
| Cookie prefix `hosanna` (cross-subdomain on `hosanna.live`) | Studio (primary), Flutter         |
| `Authorization: Bearer <session token>`                     | Flutter, MCP, API clients         |
| `set-auth-token` response header                            | Flutter TokenStore / SessionStore |
| JWE cookie cache (~15 min)                                  | Performance                       |

Session extras: `fcm`, `notify`, `activeOrganizationId`, `activeTeamId`.

**API rule:** after public health/cron/auth, `authenticate` requires a valid session **and** an active organization for domain routes.

### Plugins (server)

`i18n`, `dash`, `admin`, `inbox` (`better-inbox`), `bearer`, `jwt`, `mcp` (OAuth 2.1), `cimd` (Claude client metadata), `haveIBeenPwned`, `sentinel`, `captcha`, `twoFactor`, `organization` (teams + custom roles), `stripe`.

### MCP OAuth

- Login/consent UX on Auth (`AUTH_URL/login`, `/oauth/consent`)
- Resource audience must equal `MCP_RESOURCE_URL` (still on API)
- DCR + CIMD; scopes include `openid profile email offline_access`
- JWT verified via `{AUTH_URL}/api/auth/jwks`

## Organizations and roles

Organizations are the tenant boundary. Teams are optional subgroups.

**Roles** (`packages/auth/src/roles.ts`, `@hosanna/auth`):

| Role                  | Typical use                                      |
| --------------------- | ------------------------------------------------ |
| `owner`               | Full control + billing                           |
| `admin`               | Org admin without ownership transfer constraints |
| `teamLeader`          | Lead a team                                      |
| `editor`              | Edit library / services                          |
| `musician` / `member` | Consume + limited edit                           |
| `guest`               | Minimal access                                   |

Permission statements cover: song, service, folder, collection, agenda, settings, ai, export, backup, billing, notification, plus Better Auth org defaults.

Middleware: `requirePermission` / `requireAll` / `requireAny` / `requireRole`.

## Billing (Stripe)

Via `@better-auth/stripe`:

- Plan name: **`cloud`** (monthly + annual price IDs)
- 14-day trial
- Subscriptions are **org-scoped** (`referenceId` = organization id)
- Checkout: promo codes, ToS consent
- Webhooks handled under `/api/auth` (`STRIPE_WEBHOOK_SECRET`)
- Lifecycle emails + org notifications (trial start/end/expire, subscribe, cancel)

### Entitlement gate

- `GET /api/billing/entitlement` → `{ entitled }` on **auth.hosanna.live** (Flutter already hit the auth host)
- `GET /api/billing/pricing` → public plan display amounts on **auth**, read from Vercel Global Config key **`hosanna-cloud`** (`GLOBAL_CONFIG` connection string)
- Period fields are stable ids (`month` | `year`); clients localize via shared `@hosanna/i18n` (`billing.period.*` / `billingPeriodLabel`)
- API `requireSubscription` middleware still gates **domain** non-GET writes when the org is not active/trialing (reads shared `Subscription` rows)
- Studio onboarding also checks trial/subscription before entering the main shell

Studio client uses `authClient.subscription.*` (list, upgrade, portal); display prices fetch from auth `/api/billing/pricing`.

## Suite hub and personal preferences

Auth also hosts the post-login **home** (`/home`), session-gated **suite app catalog** (`GET /api/suite/apps`), and the shared store for **theme / language** plus per-app preference scopes under `user.metadata`.

See [suite-hub-and-preferences.md](./suite-hub-and-preferences.md) for App Switcher, AccountMenu, caching, and how to `registerAppSettingsScope` for a new suite app.

Expected `hosanna-cloud` Global Config JSON:

```json
{
  "plan": "cloud",
  "currency": "eur",
  "monthly": { "amountCents": 1200, "amountDisplay": "€12", "period": "month" },
  "annual": { "amountCents": 12000, "amountDisplay": "€120", "period": "year" }
}
```

## Flutter / Studio session lifecycle (summary)

1. Sign in → session cookie ± bearer token
2. Register FCM via auth `/api/notifications/devices` (Flutter)
3. List / create org → `setActive`
4. Check entitlement on auth
5. Start replication against org-scoped data on the API
6. On logout: disable push device, clear session + wipe local DB
7. On org switch: reset local store + checkpoints, then sync again

## Email & notifications

Transactional mail still goes through **Resend** + Handlebars on the auth app. Product and org fan-out (inbox / push / email) go through the unified dispatcher — see [notifications.md](./notifications.md).
