/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type {
  ReplicationSyncState,
  StatusSubject,
  ReplicationManager,
  ReplicationCollectionConfig,
  ReplicationHttpClient,
  ReplicationStorage,
  ReplicationOptions,
  Checkpoint,
  SyncableDoc,
  ChangeRow,
  WirePartial,
  PendingChange,
} from "./types";

export { makeStatusSubject } from "./status";

export {
  VOLATILE_FIELDS,
  omitVolatile,
  deepEqual,
  isSpuriousConflict,
  stripNonReplicatedFields,
  diffNewDocumentState,
  toAssumedMasterState,
  chunkArray,
} from "./wire";

export {
  createReplicationManager,
  resetReplicationManager,
  clearReplicationState,
} from "./createManager";

export { pushWithConflictRetry } from "./push";
export { pullCollection, PULL_BATCH } from "./pull";
export {
  replicateCollection,
  runSyncCycle,
  groupCollectionsByWave,
  countConfiguredDocs,
  PUSH_BATCH,
} from "./cycle";
