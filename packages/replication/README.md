# `@hosanna/replication`

Local-first IndexedDB collection engine and configurable HTTP replication for Hosanna apps.

Private package — source exports only (no build step), same style as `@hosanna/logos-ai` / `@hosanna/ui`.

## Engine

- `HosanaCollection` — in-memory store + IndexedDB persistence
- `openIDB` / `idb*` helpers
- Reactive bus (`subscribe` / `notify` / local-change / push-baseline)

## Replication

```ts
import { createReplicationManager } from "@hosanna/replication";

const manager = createReplicationManager({
  db,
  collections: [
    { name: "services", wave: 0 },
    { name: "songs", wave: 1 },
    { name: "folders", wave: 1 },
  ],
  orgSlug: "acme",
  http: { request: (path, init) => api.request(path, init) },
  canSync: () => true,
  storage: {
    checkpointDbName: () => "app_checkpoints",
    checkpointLsPrefix: () => "app_repl_checkpoint",
    epochLsKey: () => "app_repl_epoch",
  },
  onAfterSync: async ({ db }) => {
    // e.g. recalculate derived local-only counts
  },
});

manager.start();
```

Collections are never hard-coded in this package — the host app supplies wave-ordered configs.

## Manager API

`{ start, stop, replicateNow, status$, getStatus }`

Use `resetReplicationManager()` to tear down the singleton; `clearReplicationState(storage)` to wipe checkpoints / server-state cache / population epoch.
