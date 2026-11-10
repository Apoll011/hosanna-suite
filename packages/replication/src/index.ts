/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * `@hosanna/replication` — IndexedDB engine + configurable HTTP replication.
 */

export {
  HosanaCollection,
  openIDB,
  idbGet,
  idbGetAll,
  idbGetAllByIndex,
  idbBulkPut,
  idbPut,
  idbDelete,
  idbBulkDelete,
  idbClear,
  idbCount,
  _registerResetDatabase,
  subscribe,
  notify,
  notifyCollection,
  subscribeLocalChange,
  notifyLocalChange,
  subscribePushBaseline,
  notifyPushBaseline,
  type AnyDoc,
  type Selector,
  type FindOptions,
  type Subscription,
  type Observable,
  type LiveQuery,
  type LiveDocument,
  type HosanaDoc,
  type Listener,
} from "./engine";

export {
  createReplicationManager,
  resetReplicationManager,
  clearReplicationState,
  deepEqual,
  diffNewDocumentState,
  stripNonReplicatedFields,
  omitVolatile,
  isSpuriousConflict,
  type ReplicationSyncState,
  type StatusSubject,
  type ReplicationManager,
  type ReplicationCollectionConfig,
  type ReplicationHttpClient,
  type ReplicationStorage,
  type ReplicationOptions,
  type Checkpoint,
  type SyncableDoc,
} from "./replication";
