/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Pull loop for one collection — pages until a short batch.
 */

import type { HosanaCollection } from "../engine/collection";
import { loadCheckpoint, saveCheckpoint } from "./checkpoints";
import type { ServerCache } from "./serverCache";
import { persistServerCache } from "./serverCache";
import type { Checkpoint, ReplicationHttpClient, ReplicationStorage, SyncableDoc } from "./types";
import { stripNonReplicatedFields } from "./wire";

export const PULL_BATCH = 100;

type AnyCollection = HosanaCollection<SyncableDoc & Record<string, unknown>>;

/**
 * Pull documents from the server into the local collection.
 * Updates checkpoints and the server-state cache as pages arrive.
 *
 * @returns whether the server-state cache was mutated (caller may persist).
 */
export async function pullCollection<T extends SyncableDoc & Record<string, unknown>>(
  collection: AnyCollection,
  collectionName: string,
  http: ReplicationHttpClient,
  storage: ReplicationStorage,
  serverCache: ServerCache,
  options: {
    forceFullPull?: boolean;
    shouldAbort?: () => boolean;
    initialCheckpoint?: Checkpoint | null;
  } = {},
): Promise<boolean> {
  const shouldAbort = options.shouldAbort ?? (() => false);
  const localFields = collection.getLocalFieldNames();
  let cacheDirty = false;

  const checkpoint =
    options.initialCheckpoint !== undefined
      ? options.initialCheckpoint
      : await loadCheckpoint(storage, collectionName);

  let pullCheckpoint = options.forceFullPull ? null : checkpoint;

  while (!shouldAbort()) {
    const res = await http.request<{
      documents: T[];
      checkpoint: Checkpoint | null;
    }>(`/replication/${collectionName}/pull`, {
      method: "POST",
      body: JSON.stringify({
        checkpoint: pullCheckpoint || null,
        limit: PULL_BATCH,
      }),
    });

    const docs = (res.documents || []).map((d) => ({
      ...d,
      _deleted: !!d._deleted,
    })) as (T & { _deleted: boolean })[];

    if (docs.length > 0) {
      const live: (T & { _deleted: boolean })[] = [];
      const deletedIds: string[] = [];

      for (const doc of docs) {
        if (doc._deleted) {
          serverCache.delete(doc.id);
          deletedIds.push(doc.id);
        } else {
          serverCache.set(doc.id, stripNonReplicatedFields(doc, localFields));
          live.push(doc);
        }
        cacheDirty = true;
      }

      if (deletedIds.length > 0) {
        await (collection as unknown as HosanaCollection<T>)._purgeIds(deletedIds);
      }
      if (live.length > 0) {
        await (collection as unknown as HosanaCollection<T>)._mergeBatchFromServer(live);
      }
    }

    if (res.checkpoint) {
      pullCheckpoint = res.checkpoint;
      await saveCheckpoint(storage, collectionName, pullCheckpoint);
    }

    if (docs.length < PULL_BATCH) break;
  }

  if (cacheDirty && !shouldAbort()) {
    await persistServerCache(storage, collectionName);
  }

  return cacheDirty;
}
