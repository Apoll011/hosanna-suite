import { createCache } from "@hosanna/cache";

export type ReplicatedCollection =
  "songs" | "folders" | "collections" | "services" | "agendaEvents";

export interface ReplicationCheckpoint {
  updatedAt: number;
  id: string;
}

type CheckpointEntry = {
  checkpoint: ReplicationCheckpoint | null;
};

const CHECKPOINT_TTL_MS = 60_000;

const checkpoints = createCache({
  namespace: "sync:checkpoint",
  ttlMs: CHECKPOINT_TTL_MS,
});

function key(tenantId: string, collection: ReplicatedCollection) {
  return `${tenantId}:${collection}`;
}

export const syncCache = {
  async hasNoChanges(
    tenantId: string,
    collection: ReplicatedCollection,
    clientCheckpoint: ReplicationCheckpoint | null,
  ): Promise<boolean> {
    const entry = await checkpoints.get<CheckpointEntry>(key(tenantId, collection));
    if (!entry) return false;

    if (!clientCheckpoint) return entry.checkpoint === null;
    if (entry.checkpoint === null) return true;

    return (
      clientCheckpoint.updatedAt === entry.checkpoint.updatedAt &&
      clientCheckpoint.id === entry.checkpoint.id
    );
  },

  async setLatestCheckpoint(
    tenantId: string,
    collection: ReplicatedCollection,
    checkpoint: ReplicationCheckpoint | null,
  ): Promise<void> {
    await checkpoints.set(key(tenantId, collection), {
      checkpoint: checkpoint ? { updatedAt: checkpoint.updatedAt, id: checkpoint.id } : null,
    });
  },

  async invalidate(tenantId: string, collection?: ReplicatedCollection): Promise<void> {
    if (collection) {
      await checkpoints.delete(key(tenantId, collection));
      return;
    }
    await Promise.all(
      (
        ["songs", "folders", "collections", "services", "agendaEvents"] as ReplicatedCollection[]
      ).map((c) => checkpoints.delete(key(tenantId, c))),
    );
  },

  async invalidateAll(): Promise<void> {
    await checkpoints.clear();
  },
};
