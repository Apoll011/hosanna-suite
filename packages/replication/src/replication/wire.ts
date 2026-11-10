/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SyncableDoc, WirePartial } from "./types";

export const VOLATILE_FIELDS = ["updatedAt", "_rev", "_meta", "_attachments"] as const;

export function omitVolatile<T extends Record<string, unknown>>(doc: T): Partial<T> {
  const clone: Partial<T> = { ...doc };
  for (const field of VOLATILE_FIELDS) delete clone[field as keyof T];
  return clone;
}

export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  const aKeys = Object.keys(a as object);
  const bKeys = Object.keys(b as object);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((k) =>
    deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]),
  );
}

export function isSpuriousConflict<T extends SyncableDoc>(
  assumedMasterState: T | undefined,
  serverDoc: T,
): boolean {
  if (!assumedMasterState) return false;
  return deepEqual(omitVolatile(assumedMasterState), omitVolatile(serverDoc));
}

/**
 * Strip local-only / engine-internal fields before anything hits the wire.
 */
export function stripNonReplicatedFields<T extends SyncableDoc>(
  doc: T,
  localFields: ReadonlySet<string>,
): T {
  const out: Record<string, unknown> = { ...doc };
  for (const f of localFields) delete out[f];
  delete out["__tombstone"];
  delete out["score"]; // belt-and-suspenders for songs
  return out as T;
}

function isVolatileKey(key: string): boolean {
  return (VOLATILE_FIELDS as readonly string[]).includes(key);
}

/**
 * Build newDocumentState for the wire.
 * Always includes `id` + `updatedAt`. With a known server baseline, only
 * changed fields are included (server applies partial updates). Creates
 * (no baseline) send the full document — assumedMasterState will be null and
 * the server treats that as an insert.
 */
export function diffNewDocumentState<T extends SyncableDoc>(
  current: T & { _deleted: boolean },
  previous: (T & { _deleted: boolean }) | null,
): WirePartial<T> & { _deleted?: boolean } {
  if (!previous) {
    const full: Record<string, unknown> = { ...current };
    for (const field of VOLATILE_FIELDS) delete full[field];
    return full as WirePartial<T> & { _deleted?: boolean };
  }

  const delta: Record<string, unknown> = {
    id: current.id,
    updatedAt: current.updatedAt,
  };

  const keys = new Set([...Object.keys(current), ...Object.keys(previous)]);

  for (const key of keys) {
    if (key === "id" || key === "updatedAt" || isVolatileKey(key)) continue;
    if (
      !deepEqual(
        (current as Record<string, unknown>)[key],
        (previous as Record<string, unknown>)[key],
      )
    ) {
      delta[key] = (current as Record<string, unknown>)[key];
    }
  }

  return delta as WirePartial<T> & { _deleted?: boolean };
}

/**
 * assumedMasterState on the wire: only id + updatedAt from the last known
 * server snapshot. The server conflict-checks exclusively on updatedAt.
 */
export function toAssumedMasterState(assumed: SyncableDoc & { _deleted?: boolean }): {
  id: string;
  updatedAt: string;
} {
  return { id: assumed.id, updatedAt: assumed.updatedAt };
}

export function chunkArray<T>(arr: T[], size: number): T[][] {
  if (arr.length <= size) return [arr];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}
