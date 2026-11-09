# Hosanna OpenAPI

Hand-maintained OpenAPI 3.1 description of the production REST API under `/api`.

- Spec: [`packages/types/openapi.yaml`](../../../packages/types/openapi.yaml) (published to the workspace as `@hosanna/types`)
- Regenerator: [`generate.mjs`](./generate.mjs) (rebuilds the YAML from an in-script inventory, then regenerates the TypeScript types)

```bash
pnpm run openapi:generate
```

## Scope

| Included                                                                                                                          | Excluded                                                   |
| --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Health, billing, cron, songs, folders, services, notes, annotations, replication, trash, backup, AI, YouTube/Cifra, notifications | Better Auth (`AUTH_URL/api/auth/*`, hosted by `apps/auth`) — use Better Auth docs/clients |
|                                                                                                                                   | MCP (`/mcp`)                                               |

Auth: Better Auth session cookie **or** `Authorization: Bearer`. Cron routes use `CRON_SECRET` as Bearer.

## Consumers

Studio imports the generated types from `@hosanna/types` (`openapi-fetch`). The Flutter app generates its Dart Dio client from the same spec.
