/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Run one sync wave/cycle over configured collections (push-first, then pull).
 */

import type { AnyDoc, HosanaCollection } from "../engine/collection";
import { loadCheckpoint } from "./checkpoints";
import { pullCollection, PULL_BATCH } from "./pull";
import { pushWithConflictRetry } from "./push";
import { hydrateServerCache, persistServerCache, type ServerCache } from "./serverCache";
import type {
  Checkpoint,
  PendingChange,
  ReplicationCollectionConfig,
  ReplicationHttpClient,
  ReplicationStorage,
  SyncableDoc,
} from "./types";
import { chunkArray, deepEqual, omitVolatile, stripNonReplicatedFields } from "./wire";

export { PULL_BATCH };
export const PUSH_BATCH = 50;

type AnyCollection = HosanaCollection<SyncableDoc & Record<string, unknown>>;

/** Compare checkpoint (numeric ms or ISO) against a doc's ISO updatedAt. */
function checkpointToIso(cp: Checkpoint): string {
  return typeof cp.updatedAt === "number"
    ? new Date(cp.updatedAt).toISOString()
    : String(cp.updatedAt);
}

/**
 * Push then pull one collection.
 */
export async function replicateCollection<T extends SyncableDoc & Record<string, unknown>>(
  collection: AnyCollection,
  collectionName: string,
  http: ReplicationHttpClient,
  storage: ReplicationStorage,
  forceFullPull = false,
  shouldAbort: () => boolean = () => false,
): Promise<void> {
  if (shouldAbort()) return;

  const checkpoint = await loadCheckpoint(storage, collectionName);
  const serverCache = await hydrateServerCache(storage, collectionName);
  const localFields = collection.getLocalFieldNames();
  let cacheDirty = false;

  const checkpointTs = checkpoint ? checkpointToIso(checkpoint) : null;
  const allDocs = (collection as unknown as HosanaCollection<T>).getAllRaw();

  const toPush = allDocs.filter((d) => {
    const stripped = stripNonReplicatedFields(d, localFields);
    const newState = {
      ...stripped,
      _deleted: !!stripped._deleted,
    } as T & { _deleted: boolean };

    const cached = serverCache.get(d.id) as (T & { _deleted: boolean }) | undefined;

    if (cached) {
      return (
        newState._deleted !== !!cached._deleted ||
        newState.updatedAt !== cached.updatedAt ||
        !deepEqual(
          omitVolatile(newState as Record<string, unknown>),
          omitVolatile(cached as Record<string, unknown>),
        )
      );
    }

    return !checkpointTs || (typeof d.updatedAt === "string" && d.updatedAt > checkpointTs);
  });

  if (toPush.length > 0 && !shouldAbort()) {
    cacheDirty =
      (await pushPendingChanges(
        collection,
        collectionName,
        http,
        serverCache,
        toPush,
        localFields,
        shouldAbort,
      )) || cacheDirty;
  }

  if (shouldAbort()) return;

  const pullDirty = await pullCollection<T>(
    collection,
    collectionName,
    http,
    storage,
    serverCache,
    {
      forceFullPull,
      shouldAbort,
      initialCheckpoint: checkpoint,
    },
  );

  // pullCollection already persists when dirty; only persist leftover push dirt.
  if (cacheDirty && !pullDirty && !shouldAbort()) {
    await persistServerCache(storage, collectionName);
  }
}

async function pushPendingChanges<T extends SyncableDoc & Record<string, unknown>>(
  collection: AnyCollection,
  collectionName: string,
  http: ReplicationHttpClient,
  serverCache: ServerCache,
  toPush: T[],
  localFields: ReadonlySet<string>,
  shouldAbort: () => boolean,
): Promise<boolean> {
  let cacheDirty = false;
  const pushedFull = new Map<string, T & { _deleted: boolean }>();

  const pendingChanges: PendingChange<T>[] = toPush.map((doc) => {
    const stripped = stripNonReplicatedFields(doc, localFields);
    const newState = {
      ...stripped,
      _deleted: !!stripped._deleted,
    } as T & { _deleted: boolean };

    pushedFull.set(doc.id, newState);

    const cached = (serverCache.get(doc.id) as (T & { _deleted: boolean }) | undefined) ?? null;

    return {
      fullNew: newState,
      fullAssumed: cached,
    };
  });

  const realConflicts: (T & { _deleted: boolean })[] = [];

  for (const batch of chunkArray(pendingChanges, PUSH_BATCH)) {
    if (shouldAbort()) return cacheDirty;
    const conflicts = await pushWithConflictRetry<T>(http, collectionName, batch);
    realConflicts.push(...conflicts);
  }

  const conflictIds = new Set(realConflicts.map((c) => c.id));

  const tombstonesToPurge: string[] = [];
  for (const [id, full] of pushedFull) {
    if (conflictIds.has(id)) continue;
    if (full._deleted) {
      serverCache.delete(id);
      tombstonesToPurge.push(id);
    } else {
      serverCache.set(id, full);
    }
    cacheDirty = true;
  }

  if (tombstonesToPurge.length > 0) {
    await (collection as unknown as HosanaCollection<T>)._purgeIds(tombstonesToPurge);
  }

  if (realConflicts.length > 0) {
    const live: (T & { _deleted: boolean })[] = [];
    const deletedIds: string[] = [];
    for (const serverDoc of realConflicts) {
      if (serverDoc._deleted) {
        serverCache.delete(serverDoc.id);
        deletedIds.push(serverDoc.id);
      } else {
        serverCache.set(serverDoc.id, serverDoc);
        live.push(serverDoc);
      }
      cacheDirty = true;
    }
    if (deletedIds.length > 0) {
      await (collection as unknown as HosanaCollection<T>)._purgeIds(deletedIds);
    }
    if (live.length > 0) {
      await (collection as unknown as HosanaCollection<T>)._mergeBatchFromServer(live, {
        force: true,
      });
    }
  }

  return cacheDirty;
}

/**
 * Group collection configs by wave number (ascending). Same wave → parallel.
 */
export function groupCollectionsByWave(
  collections: ReplicationCollectionConfig[],
): ReplicationCollectionConfig[][] {
  const byWave = new Map<number, ReplicationCollectionConfig[]>();
  for (const c of collections) {
    const list = byWave.get(c.wave) ?? [];
    list.push(c);
    byWave.set(c.wave, list);
  }
  return Array.from(byWave.entries())
    .sort(([a], [b]) => a - b)
    .map(([, list]) => list);
}

export type DbWithCollections = Record<string, HosanaCollection<AnyDoc>> & {
  _idb?: IDBDatabase;
};

/**
 * Run one full sync cycle: push+pull each configured collection in wave order.
 */
export async function runSyncCycle(
  db: DbWithCollections,
  collections: ReplicationCollectionConfig[],
  http: ReplicationHttpClient,
  storage: ReplicationStorage,
  forceFullPull: boolean,
  shouldAbort: () => boolean,
): Promise<void> {
  const waves = groupCollectionsByWave(collections);

  for (const wave of waves) {
    if (shouldAbort()) return;
    await Promise.all(
      wave.map((cfg) => {
        const collection = db[cfg.name] as unknown as AnyCollection | undefined;
        if (!collection) {
          console.warn(`[replication] collection "${cfg.name}" missing on db — skipping`);
          return Promise.resolve();
        }
        return replicateCollection(collection, cfg.name, http, storage, forceFullPull, shouldAbort);
      }),
    );
  }
}

/** Sum in-memory doc counts across configured collections (wipe detection). */
export function countConfiguredDocs(
  db: DbWithCollections,
  collections: ReplicationCollectionConfig[],
): number {
  let total = 0;
  for (const cfg of collections) {
    const col = db[cfg.name] as HosanaCollection<AnyDoc> | undefined;
    if (col) total += col.getAllRaw().length;
  }
  return total;
}
