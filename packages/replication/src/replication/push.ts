/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ChangeRow, PendingChange, ReplicationHttpClient, SyncableDoc } from "./types";
import { diffNewDocumentState, isSpuriousConflict, toAssumedMasterState } from "./wire";

const CONFLICT_RETRY_LIMIT = 3;

function toChangeRow<T extends SyncableDoc>(change: PendingChange<T>): ChangeRow<T> {
  return {
    newDocumentState: diffNewDocumentState(change.fullNew, change.fullAssumed),
    assumedMasterState: change.fullAssumed ? toAssumedMasterState(change.fullAssumed) : null,
  };
}

export async function pushWithConflictRetry<T extends SyncableDoc>(
  http: ReplicationHttpClient,
  collectionName: string,
  changes: PendingChange<T>[],
): Promise<(T & { _deleted: boolean })[]> {
  let pending = changes;
  const realConflicts: (T & { _deleted: boolean })[] = [];

  for (let attempt = 0; attempt <= CONFLICT_RETRY_LIMIT; attempt++) {
    const changeRows: ChangeRow<T>[] = pending.map(toChangeRow);
    const res = await http.request<{ conflicts?: T[] } | T[]>(
      `/replication/${collectionName}/push`,
      {
        method: "POST",
        body: JSON.stringify({ changeRows }),
      },
    );

    const conflicts = (
      Array.isArray(res) ? res : (res as { conflicts?: T[] })?.conflicts || []
    ).map((doc) => ({ ...doc, _deleted: !!doc._deleted }) as T & { _deleted: boolean });

    if (conflicts.length === 0) break;

    const conflictsById = new Map(conflicts.map((c) => [c.id, c]));
    const retryChanges: PendingChange<T>[] = [];

    for (const change of pending) {
      const serverDoc = conflictsById.get(change.fullNew.id);
      if (!serverDoc) continue;

      // Compare full assumed snapshot (not the wire delta) so partial
      // payloads don't break spurious-conflict detection.
      // Also retry when assumed was missing (cold cache after refresh).
      const missingAssumed = change.fullAssumed == null;
      const canRetry =
        attempt < CONFLICT_RETRY_LIMIT &&
        (missingAssumed || isSpuriousConflict(change.fullAssumed as T | undefined, serverDoc));

      if (canRetry) {
        retryChanges.push({
          fullNew: change.fullNew,
          fullAssumed: serverDoc,
        });
      } else {
        realConflicts.push(serverDoc);
      }
    }

    if (retryChanges.length === 0) break;
    pending = retryChanges;
  }

  return realConflicts;
}
