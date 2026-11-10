/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Studio-specific replication wiring — collection waves + storage keys.
 */

import {
  clearReplicationState as clearPkg,
  createReplicationManager,
  resetReplicationManager,
  type ReplicationManager,
} from "@hosanna/replication";
import { getApiClient } from "@/src/api";
import { recalculateAllDerivedCounts } from "./counts";
import type { HosanaDatabase } from "./database";
import {
  deleteIndexedDbByName,
  getCheckpointDbName,
  getCheckpointLsPrefix,
  getEpochLsKey,
} from "./dbNames";
import { orgScopeAllowsSync } from "./orgScope";

export const STUDIO_REPLICATION_COLLECTIONS = [
  { name: "services", wave: 0 },
  { name: "songs", wave: 1 },
  { name: "folders", wave: 1 },
  { name: "collections", wave: 1 },
  { name: "agendaEvents", wave: 2 },
] as const;

function studioReplicationStorage() {
  return {
    checkpointDbName: getCheckpointDbName,
    checkpointLsPrefix: getCheckpointLsPrefix,
    epochLsKey: getEpochLsKey,
    deleteCheckpointDb: () => deleteIndexedDbByName(getCheckpointDbName()),
  };
}

export function setupReplication(db: HosanaDatabase, orgSlug: string): ReplicationManager {
  return createReplicationManager({
    db,
    collections: [...STUDIO_REPLICATION_COLLECTIONS],
    orgSlug,
    http: {
      request: <T>(path: string, init?: RequestInit & { method?: string; body?: string }) =>
        getApiClient().request(path, init) as Promise<T>,
    },
    canSync: () => orgScopeAllowsSync(db, orgSlug),
    storage: studioReplicationStorage(),
    onAfterSync: async ({ db: syncedDb }) => {
      await recalculateAllDerivedCounts(syncedDb);
    },
    logPrefix: "[hosana-repl]",
  });
}

/** Tear down the package singleton (compat name used by Auth/Sync contexts). */
export function resetReplication(): void {
  resetReplicationManager();
}

/**
 * Wipe durable replication state for the active storage namespace
 * (demo vs prod checkpoint DB / LS keys).
 */
export async function clearReplicationState(): Promise<void> {
  await clearPkg(studioReplicationStorage());
}

export type { ReplicationManager };
