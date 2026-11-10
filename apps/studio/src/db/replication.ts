/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Thin re-export for SyncContext / AuthContext / orgScope compat.
 * Collection waves and storage wiring live in `./replicationConfig`.
 */

export {
  setupReplication,
  resetReplication,
  clearReplicationState,
  STUDIO_REPLICATION_COLLECTIONS,
  type ReplicationManager,
} from "./replicationConfig";

export type { ReplicationSyncState, StatusSubject } from "@hosanna/replication";
