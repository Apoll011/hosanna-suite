/**
 * @license
 * SPDX-License-Identifier: AGPL-3.0-only
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
