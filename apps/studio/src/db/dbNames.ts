/**
 * IndexedDB / checkpoint name helpers.
 *
 * Demo/onboarding sessions must never share storage with a real organization —
 * otherwise the replication engine can push demo docs to the server.
 */

import { isDemoMode } from "../demo/flags";

export const PROD_DB_NAME = "hosana_idb";
export const DEMO_DB_NAME = "hosana_idb_demo";

export const PROD_CHECKPOINT_DB_NAME = "hosana_checkpoints";
export const DEMO_CHECKPOINT_DB_NAME = "hosana_checkpoints_demo";

export const PROD_CHECKPOINT_LS_PREFIX = "hosana_repl_checkpoint";
export const DEMO_CHECKPOINT_LS_PREFIX = "demo_hosana_repl_checkpoint";

export const PROD_EPOCH_LS_KEY = "hosana_repl_epoch";
export const DEMO_EPOCH_LS_KEY = "demo_hosana_repl_epoch";

/** Databases that belong exclusively to demo / interactive onboarding. */
export const DEMO_DATABASE_NAMES = [
  DEMO_DB_NAME,
  DEMO_CHECKPOINT_DB_NAME,
] as const;

export function getMainDbName(): string {
  return isDemoMode() ? DEMO_DB_NAME : PROD_DB_NAME;
}

export function getCheckpointDbName(): string {
  return isDemoMode() ? DEMO_CHECKPOINT_DB_NAME : PROD_CHECKPOINT_DB_NAME;
}

export function getCheckpointLsPrefix(): string {
  return isDemoMode() ? DEMO_CHECKPOINT_LS_PREFIX : PROD_CHECKPOINT_LS_PREFIX;
}

export function getEpochLsKey(): string {
  return isDemoMode() ? DEMO_EPOCH_LS_KEY : PROD_EPOCH_LS_KEY;
}

/** Delete a single IndexedDB by name (resolves even on error/blocked). */
export function deleteIndexedDbByName(name: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof indexedDB === "undefined") {
      resolve();
      return;
    }
    const req = indexedDB.deleteDatabase(name);
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    req.onblocked = () => resolve();
  });
}
