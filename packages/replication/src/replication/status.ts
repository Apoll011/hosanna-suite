/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ReplicationSyncState, StatusSubject } from "./types";

export function makeStatusSubject(): StatusSubject {
  const listeners = new Set<(s: ReplicationSyncState) => void>();
  return {
    subscribe(fn) {
      listeners.add(fn);
      return { unsubscribe: () => listeners.delete(fn) };
    },
    next(s) {
      for (const fn of Array.from(listeners)) fn(s);
    },
  };
}
