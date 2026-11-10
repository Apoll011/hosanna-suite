/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Checkpoint persistence — dual-written to IndexedDB + localStorage.
 * Population epoch detects spurious IDB wipes across sessions.
 */

import { idbClear, idbGet, idbPut, openIDB } from "../engine/idb";
import type { Checkpoint, ReplicationStorage } from "./types";

let _cpDb: IDBDatabase | null = null;
let _cpDbName: string | null = null;

export const CP_IDB_VERSION = 2;
export const CP_STORE = "checkpoints";
export const CACHE_STORE = "server_state";

export function clearCheckpointDbHandle(): void {
  _cpDb = null;
  _cpDbName = null;
}

export async function getCheckpointDb(storage: ReplicationStorage): Promise<IDBDatabase> {
  const wantedName = storage.checkpointDbName();
  if (_cpDb && _cpDbName === wantedName) {
    try {
      void _cpDb.objectStoreNames.length;
      return _cpDb;
    } catch {
      _cpDb = null;
      _cpDbName = null;
    }
  }
  _cpDb = await openIDB(wantedName, CP_IDB_VERSION, (db, oldVersion) => {
    if (oldVersion < 1) {
      db.createObjectStore(CP_STORE, { keyPath: "collection" });
    }
    if (oldVersion < 2 && !db.objectStoreNames.contains(CACHE_STORE)) {
      db.createObjectStore(CACHE_STORE, { keyPath: "collection" });
    }
  });
  _cpDbName = wantedName;
  _cpDb.onclose = () => {
    _cpDb = null;
    _cpDbName = null;
  };
  return _cpDb;
}

export async function loadCheckpoint(
  storage: ReplicationStorage,
  collectionName: string,
): Promise<Checkpoint | null> {
  try {
    const db = await getCheckpointDb(storage);
    const row = await idbGet<{ collection: string; cp: Checkpoint }>(db, CP_STORE, collectionName);
    if (row?.cp) return row.cp;
  } catch {
    _cpDb = null;
    _cpDbName = null;
  }

  try {
    const raw = localStorage.getItem(`${storage.checkpointLsPrefix()}_${collectionName}`);
    if (raw) {
      const cp = JSON.parse(raw) as Checkpoint;
      void saveCheckpoint(storage, collectionName, cp);
      return cp;
    }
  } catch {
    // localStorage unavailable or corrupted
  }

  return null;
}

export async function saveCheckpoint(
  storage: ReplicationStorage,
  collectionName: string,
  cp: Checkpoint,
): Promise<void> {
  try {
    const db = await getCheckpointDb(storage);
    await idbPut(db, CP_STORE, { collection: collectionName, cp });
  } catch {
    _cpDb = null;
    _cpDbName = null;
  }

  try {
    localStorage.setItem(`${storage.checkpointLsPrefix()}_${collectionName}`, JSON.stringify(cp));
  } catch {}
}

/**
 * Mark that the main IDB has been confirmed populated.
 * Only set once (epoch 0 → 1) so empty-account sessions don't keep triggering
 * false-positive wipe detection forever.
 */
export function markPopulationEpoch(storage: ReplicationStorage): void {
  try {
    if (getPopulationEpoch(storage) > 0) return;
    localStorage.setItem(storage.epochLsKey(), "1");
  } catch {}
}

export function getPopulationEpoch(storage: ReplicationStorage): number {
  try {
    return parseInt(localStorage.getItem(storage.epochLsKey()) ?? "0", 10) || 0;
  } catch {
    return 0;
  }
}

/** Wipe durable checkpoint IDB stores + localStorage keys + population epoch. */
export async function clearCheckpointPersistence(storage: ReplicationStorage): Promise<void> {
  try {
    localStorage.removeItem(storage.epochLsKey());
  } catch {}

  try {
    const prefix = `${storage.checkpointLsPrefix()}_`;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) keysToRemove.push(key);
    }
    for (const key of keysToRemove) localStorage.removeItem(key);
  } catch {}

  try {
    const cpDb = await getCheckpointDb(storage);
    await Promise.all([idbClear(cpDb, CP_STORE), idbClear(cpDb, CACHE_STORE)]);
  } catch {
    _cpDb = null;
    _cpDbName = null;
    try {
      await storage.deleteCheckpointDb?.();
    } catch {}
  }
}
