# Hosanna OpenAPI

OpenAPI 3.1 contract of the production REST APIs under `/api`.

- Spec: [`packages/types/openapi.yaml`](../packages/types/openapi.yaml) (published as `@hosanna/types`)
- Regenerator: [`generate-openapi.mjs`](./generate-openapi.mjs) (composes the contract from domain Zod definitions and regenerates TypeScript types)

```bash
pnpm openapi:generate                    # rebuild OpenAPI spec and @hosanna/types
pnpm openapi:check                       # verify zero drift (fails on diff in packages/types)
```

## Contract Ownership & Architecture

1. **`apps/api` (`api.hosanna.live`)**:
   Owns music domain and replication REST endpoints (`/api/songs`, `/api/folders`, `/api/services`, `/api/replication`, etc.).
   - Schema source of truth: `apps/api/src/openapi/` (derives request/response schemas directly from `apps/api/src/validators/*`).
   - Live spec: `GET /api/openapi.json`
   - Live docs: `GET /api/docs` (interactive API reference via Scalar)

2. **`apps/auth` (`auth.hosanna.live`)**:
   Owns identity-adjacent REST endpoints (`/api/notifications`, `/api/billing/*`, `/api/backup*`, `/api/cron/agenda-reminders`) and Better Auth.
   - Schema source of truth: `apps/auth/lib/openapi/` + Better Auth `openAPI()` plugin in `@hosanna/auth`.
   - Live spec: `GET /api/openapi.json` (dynamically merges Better Auth routes with custom domain routes).
   - Live docs: `GET /api/auth/reference` (interactive API reference via Better Auth Scalar UI).

3. **`packages/types` (`@hosanna/types`)**:
   Single downstream artifact for client consumers.
   - Contains `packages/types/openapi.yaml` and generated `src/schema.ts`.
   - Consumed by `apps/studio` (`openapi-fetch`) and the Flutter mobile app (Dart Dio client generator).

## Scope

| Included | Excluded |
| --- | --- |
| Health, billing, cron, songs, folders, services, notes, annotations, replication, trash, backup, AI, YouTube/Cifra, notifications, Better Auth (live in auth app) | MCP (`/mcp`) |

Auth: the API validates sessions via the auth app (`AUTH_URL`) using the Better Auth session cookie **or** `Authorization: Bearer`. Cron routes use `CRON_SECRET` as Bearer.

## CI Enforcement

CI runs `pnpm openapi:check` on every push and pull request. Any drift between route/validator code and the committed contract fails the build.
