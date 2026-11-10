/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AnyDoc, HosanaCollection } from "../engine/collection";

export type ReplicationSyncState = "syncing" | "synced" | "offline" | "error";

/** Minimal Subject-like object so host SyncContext can subscribe with .subscribe() */
export interface StatusSubject {
  subscribe: (fn: (s: ReplicationSyncState) => void) => {
    unsubscribe: () => void;
  };
  next: (s: ReplicationSyncState) => void;
}

export interface ReplicationManager {
  start: (opts?: { forceFullPull?: boolean }) => void;
  stop: () => void;
  replicateNow: () => Promise<void>;
  status$: StatusSubject;
  getStatus: () => ReplicationSyncState;
}

/** Collection key on db, also used in `/replication/<name>/push|pull`. */
export type ReplicationCollectionConfig = {
  name: string;
  /** Lower waves run first; same wave runs in parallel. */
  wave: number;
};

export type ReplicationHttpClient = {
  request: <T>(path: string, init?: RequestInit & { method?: string; body?: string }) => Promise<T>;
};

export type ReplicationStorage = {
  checkpointDbName: () => string;
  checkpointLsPrefix: () => string;
  epochLsKey: () => string;
  deleteCheckpointDb?: () => Promise<void>;
};

/**
 * Host database bag. Must expose named `HosanaCollection`s for each configured
 * collection; may also carry unrelated fields (e.g. `_idb`).
 */
export type ReplicationOptions<TDb = Record<string, HosanaCollection<AnyDoc>>> = {
  db: TDb;
  /** Ordered/wave-configured collections the host wants to sync. */
  collections: ReplicationCollectionConfig[];
  orgSlug: string;
  http: ReplicationHttpClient;
  /** Gate: return false to refuse sync. */
  canSync: () => boolean | Promise<boolean>;
  storage: ReplicationStorage;
  /** After a successful full sync cycle (all waves done). Use for derived counts. */
  onAfterSync?: (ctx: { db: TDb; forceFullPull: boolean }) => void | Promise<void>;
  /** Default `"[replication]"`. */
  logPrefix?: string;
};

export interface Checkpoint {
  updatedAt: number;
  id: string;
}

export type SyncableDoc = {
  id: string;
  updatedAt: string;
  _deleted?: boolean;
};

/** Wire row for POST /push. */
export interface ChangeRow<T> {
  newDocumentState: WirePartial<T> & { _deleted?: boolean };
  assumedMasterState: { id: string; updatedAt: string } | null;
}

export type WirePartial<T> = { id: string; updatedAt: string } & Partial<T>;

/**
 * Local pending change. Full docs stay in memory for conflict retry /
 * spurious-conflict checks; only a compact delta is serialized to the wire.
 */
export interface PendingChange<T extends SyncableDoc> {
  fullNew: T & { _deleted: boolean };
  /** Last known server snapshot for this id, or null if never synced. */
  fullAssumed: (T & { _deleted: boolean }) | null;
}
