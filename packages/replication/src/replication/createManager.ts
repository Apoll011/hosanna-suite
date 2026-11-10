/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Configurable HTTP replication manager.
 * Collections / storage keys / HTTP client are injected by the host app.
 */

import { subscribeLocalChange, subscribePushBaseline } from "../engine/bus";
import type { HosanaCollection } from "../engine/collection";
import {
  clearCheckpointDbHandle,
  clearCheckpointPersistence,
  getPopulationEpoch,
  markPopulationEpoch,
} from "./checkpoints";
import { countConfiguredDocs, runSyncCycle, type DbWithCollections } from "./cycle";
import {
  clearServerCacheModule,
  hydrateServerCache,
  rememberPushBaseline,
} from "./serverCache";
import { makeStatusSubject } from "./status";
import type {
  ReplicationManager,
  ReplicationOptions,
  ReplicationStorage,
  ReplicationSyncState,
  SyncableDoc,
} from "./types";

type AnyCollection = HosanaCollection<SyncableDoc & Record<string, unknown>>;

let replicationManagerInstance: ReplicationManager | null = null;

/** Tear down the existing singleton so a fresh one can be created. */
export function resetReplicationManager(): void {
  if (replicationManagerInstance) {
    replicationManagerInstance.stop();
    replicationManagerInstance = null;
  }
  clearServerCacheModule();
  clearCheckpointDbHandle();
}

/**
 * Wipe durable replication state (checkpoints, server-state cache, population
 * epoch) using the host-injected storage key getters.
 */
export async function clearReplicationState(storage: ReplicationStorage): Promise<void> {
  clearServerCacheModule();
  await clearCheckpointPersistence(storage);
  clearCheckpointDbHandle();
}

export function createReplicationManager<TDb>(
  options: ReplicationOptions<TDb>,
): ReplicationManager {
  if (replicationManagerInstance) return replicationManagerInstance;

  const {
    db,
    collections,
    orgSlug,
    http,
    canSync,
    storage,
    onAfterSync,
    logPrefix = "[replication]",
  } = options;

  const status$ = makeStatusSubject();
  let currentStatus: ReplicationSyncState = "synced";
  let running = false;
  let interval: ReturnType<typeof setInterval> | null = null;
  let onlineListener: (() => void) | null = null;
  let offlineListener: (() => void) | null = null;
  const activeOrgSlug = orgSlug.trim();
  const collectionNames = collections.map((c) => c.name);

  // Coalescing sync lock — callers of replicateNow always await until the
  // in-flight sync AND any follow-ups queued while it ran have finished.
  let currentRun: Promise<void> | null = null;
  let syncQueued = false;
  let queuedForceFullPull = false;

  const SAVE_DEBOUNCE_MS = 800;
  let saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  const unsubscribeLocalChanges: Array<() => void> = [];
  const unsubscribePushBaselines: Array<() => void> = [];

  const dbBag = db as DbWithCollections;

  // Capture pre-write baselines for the lifetime of this manager (including
  // before start()), so an edit after refresh still gets a partial push.
  for (const name of collectionNames) {
    void hydrateServerCache(storage, name);
    const collection = dbBag[name] as unknown as AnyCollection | undefined;
    if (!collection) continue;
    unsubscribePushBaselines.push(
      subscribePushBaseline(name, (previousDoc) => {
        rememberPushBaseline(name, previousDoc, collection.getLocalFieldNames());
      }),
    );
  }

  const scheduleSyncOnSave = () => {
    if (!running) return;
    if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
    saveDebounceTimer = setTimeout(() => {
      saveDebounceTimer = null;
      void doSync();
    }, SAVE_DEBOUNCE_MS);
  };

  const updateStatus = (s: ReplicationSyncState) => {
    if (currentStatus !== s) {
      currentStatus = s;
      status$.next(s);
    }
  };

  /**
   * Detect whether the IDB appears to have been wiped since the last session.
   * If the population epoch is > 0 (data was there before) but all configured
   * collections are empty now, force a full pull.
   */
  const detectIdbWipe = (): boolean => {
    if (getPopulationEpoch(storage) === 0) return false;
    return countConfiguredDocs(dbBag, collections) === 0;
  };

  const runSyncOnce = async (forceFullPull: boolean) => {
    if (!navigator.onLine) {
      updateStatus("offline");
      return;
    }

    const scopeOk = await canSync();
    if (!scopeOk) {
      console.warn(
        `${logPrefix} refusing sync — canSync() returned false for org "${activeOrgSlug}"`,
      );
      updateStatus("error");
      return;
    }

    updateStatus("syncing");
    const shouldAbort = () => !running;

    const idbWiped = forceFullPull || detectIdbWipe();
    if (idbWiped) {
      console.warn(
        `${logPrefix} IDB appears empty after previously being populated — ` +
          "forcing full pull to restore data.",
      );
    }

    await runSyncCycle(dbBag, collections, http, storage, idbWiped, shouldAbort);
    if (shouldAbort()) return;

    // Only mark populated when we actually have data (avoids false wipe
    // detection for brand-new empty accounts).
    if (countConfiguredDocs(dbBag, collections) > 0) {
      markPopulationEpoch(storage);
    }

    try {
      await onAfterSync?.({ db, forceFullPull: idbWiped });
    } catch (err) {
      console.error(`${logPrefix} onAfterSync error:`, err);
    }

    updateStatus("synced");
  };

  const doSync = (forceFullPull = false): Promise<void> => {
    syncQueued = true;
    queuedForceFullPull = queuedForceFullPull || forceFullPull;

    if (currentRun) return currentRun;

    currentRun = (async () => {
      try {
        while (syncQueued) {
          if (!running) {
            syncQueued = false;
            queuedForceFullPull = false;
            break;
          }
          const force = queuedForceFullPull;
          syncQueued = false;
          queuedForceFullPull = false;
          try {
            await runSyncOnce(force);
          } catch (err) {
            console.error(`${logPrefix} Sync error:`, err);
            updateStatus(navigator.onLine ? "error" : "offline");
          }
        }
      } finally {
        const followUp = syncQueued && running;
        const force = queuedForceFullPull;
        currentRun = null;
        if (followUp) {
          await doSync(force);
        }
      }
    })();

    return currentRun;
  };

  const start = (opts?: { forceFullPull?: boolean }) => {
    if (running) return;
    running = true;

    void doSync(Boolean(opts?.forceFullPull));

    interval = setInterval(() => {
      if (running) void doSync();
    }, 15_000);

    onlineListener = () => {
      if (running) void doSync();
    };
    offlineListener = () => updateStatus("offline");
    window.addEventListener("online", onlineListener);
    window.addEventListener("offline", offlineListener);

    for (const name of collectionNames) {
      unsubscribeLocalChanges.push(subscribeLocalChange(name, scheduleSyncOnSave));
    }
  };

  const stop = () => {
    running = false;
    if (interval) clearInterval(interval);
    interval = null;
    if (onlineListener) window.removeEventListener("online", onlineListener);
    if (offlineListener) window.removeEventListener("offline", offlineListener);
    onlineListener = null;
    offlineListener = null;

    if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
    saveDebounceTimer = null;
    syncQueued = false;
    queuedForceFullPull = false;
    while (unsubscribeLocalChanges.length) {
      unsubscribeLocalChanges.pop()!();
    }
    while (unsubscribePushBaselines.length) {
      unsubscribePushBaselines.pop()!();
    }
  };

  const replicateNow = async () => {
    if (!navigator.onLine) {
      updateStatus("offline");
      return;
    }
    const wasRunning = running;
    if (!wasRunning) running = true;
    try {
      await doSync();
    } finally {
      if (!wasRunning) running = false;
    }
  };

  replicationManagerInstance = {
    start,
    stop,
    replicateNow,
    status$,
    getStatus: () => currentStatus,
  };

  return replicationManagerInstance;
}
