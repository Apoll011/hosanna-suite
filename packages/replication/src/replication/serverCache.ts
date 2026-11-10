/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * In-memory + IndexedDB cache of last-known server document snapshots.
 * Source of assumedMasterState.updatedAt and field-diff baselines.
 */

import { idbGet, idbPut } from "../engine/idb";
import { CACHE_STORE, clearCheckpointDbHandle, getCheckpointDb } from "./checkpoints";
import type { ReplicationStorage, SyncableDoc } from "./types";
import { stripNonReplicatedFields } from "./wire";

export type ServerCache = Map<string, SyncableDoc & { _deleted: boolean }>;

const serverStateCache = new Map<string, ServerCache>();
const serverCacheHydrated = new Set<string>();

export function clearServerCacheModule(): void {
  serverStateCache.clear();
  serverCacheHydrated.clear();
}

export function getServerCache(collectionName: string): ServerCache {
  let cache = serverStateCache.get(collectionName);
  if (!cache) {
    cache = new Map();
    serverStateCache.set(collectionName, cache);
  }
  return cache;
}

export async function hydrateServerCache(
  storage: ReplicationStorage,
  collectionName: string,
): Promise<ServerCache> {
  const cache = getServerCache(collectionName);
  if (serverCacheHydrated.has(collectionName)) return cache;

  try {
    const db = await getCheckpointDb(storage);
    const row = await idbGet<{
      collection: string;
      docs: Array<SyncableDoc & { _deleted: boolean }>;
    }>(db, CACHE_STORE, collectionName);
    if (row?.docs) {
      for (const doc of row.docs) {
        if (doc?.id) cache.set(doc.id, doc);
      }
    }
  } catch {
    clearCheckpointDbHandle();
  }

  serverCacheHydrated.add(collectionName);
  return cache;
}

export async function persistServerCache(
  storage: ReplicationStorage,
  collectionName: string,
): Promise<void> {
  const cache = getServerCache(collectionName);
  try {
    const db = await getCheckpointDb(storage);
    await idbPut(db, CACHE_STORE, {
      collection: collectionName,
      docs: Array.from(cache.values()),
    });
  } catch {
    clearCheckpointDbHandle();
  }
}

/**
 * Seed the in-memory push baseline from a pre-write local snapshot when we
 * don't yet have a last-known server state for this id.
 */
export function rememberPushBaseline(
  collectionName: string,
  previousDoc: Record<string, unknown>,
  localFields: ReadonlySet<string>,
): void {
  const id = previousDoc.id;
  if (typeof id !== "string" || !id) return;

  const cache = getServerCache(collectionName);
  if (cache.has(id)) return;

  const stripped = stripNonReplicatedFields(
    {
      ...previousDoc,
      _deleted: !!previousDoc._deleted,
    } as SyncableDoc & { _deleted: boolean } & Record<string, unknown>,
    localFields,
  );
  cache.set(id, stripped);
}
