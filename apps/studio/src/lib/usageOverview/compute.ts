/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UsageResourceId =
  | "songs"
  | "members"
  | "services"
  | "events"
  | "collections"
  | "folders"
  | "storage";

export interface UsageResource {
  id: UsageResourceId;
  /** Current usage count (or bytes for storage). */
  used: number;
  /**
   * Plan limit. `null` means unlimited on the current plan.
   * For storage, this is the browser quota when known.
   */
  limit: number | null;
  /** 0–100 when a finite limit exists; otherwise null. */
  percentage: number | null;
}

export interface UsageOverviewSummary {
  resources: UsageResource[];
  songs: number;
  members: number;
  pendingInvitations: number;
  services: number;
  activeServices: number;
  archivedServices: number;
  events: number;
  upcomingEvents: number;
  pastEvents: number;
  collections: number;
  folders: number;
  uniqueTags: number;
  trashItems: number;
  /** Estimated UTF-8 payload of local replicated docs (bytes). */
  estimatedDataBytes: number;
  /** Browser-reported storage usage when available (bytes). */
  browserUsageBytes: number | null;
  /** Browser-reported storage quota when available (bytes). */
  browserQuotaBytes: number | null;
  memberRoles: Record<string, number>;
}

export interface UsageOverviewInput {
  songs: Array<{ tags?: string[] | null }>;
  services: Array<{ archived?: boolean | null }>;
  events: Array<{ date: string }>;
  collections: unknown[];
  folders: unknown[];
  members: Array<{ role?: string | null }>;
  pendingInvitations?: number;
  trashItems?: number;
  /** Raw docs used only for JSON size estimation. */
  sizeSources?: unknown[];
  storageEstimate?: { usage: number; quota: number } | null;
  /** Local calendar date "yyyy-mm-dd" used to split upcoming vs past events. */
  today?: string;
}

function clampPercentage(used: number, limit: number | null): number | null {
  if (limit == null || limit <= 0) return null;
  return Math.min(100, Math.round((used / limit) * 100));
}

function resource(
  id: UsageResourceId,
  used: number,
  limit: number | null,
): UsageResource {
  return {
    id,
    used,
    limit,
    percentage: clampPercentage(used, limit),
  };
}

/** Rough UTF-8 byte length of a JSON-serializable value. */
export function estimateJsonBytes(value: unknown): number {
  try {
    const json = JSON.stringify(value);
    if (!json) return 0;
    if (typeof TextEncoder !== "undefined") {
      return new TextEncoder().encode(json).byteLength;
    }
    // Fallback: count code units (close enough for ASCII-heavy ChordPro).
    return json.length;
  } catch {
    return 0;
  }
}

function localToday(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Aggregate plan-usage metrics from locally available workspace data.
 * Song/service/event/folder/collection counts come from the local DB;
 * members/invites come from the active organization payload.
 */
export function computeUsageOverview(
  input: UsageOverviewInput,
): UsageOverviewSummary {
  const today = input.today ?? localToday();
  const songs = input.songs.length;
  const members = input.members.length;
  const pendingInvitations = input.pendingInvitations ?? 0;
  const services = input.services.length;
  const activeServices = input.services.filter((s) => !s.archived).length;
  const archivedServices = services - activeServices;
  const events = input.events.length;
  const upcomingEvents = input.events.filter((e) => e.date >= today).length;
  const pastEvents = events - upcomingEvents;
  const collections = input.collections.length;
  const folders = input.folders.length;
  const trashItems = input.trashItems ?? 0;

  const tagSet = new Set<string>();
  for (const song of input.songs) {
    for (const tag of song.tags ?? []) {
      const trimmed = String(tag).trim();
      if (trimmed) tagSet.add(trimmed.toLowerCase());
    }
  }

  const memberRoles: Record<string, number> = {};
  for (const member of input.members) {
    const role = member.role || "member";
    memberRoles[role] = (memberRoles[role] ?? 0) + 1;
  }

  const estimatedDataBytes = estimateJsonBytes(input.sizeSources ?? []);
  const browserUsageBytes = input.storageEstimate?.usage ?? null;
  const browserQuotaBytes = input.storageEstimate?.quota ?? null;
  const storageUsed = browserUsageBytes ?? estimatedDataBytes;
  const storageLimit = browserQuotaBytes;

  return {
    resources: [
      resource("songs", songs, null),
      resource("members", members, null),
      resource("services", services, null),
      resource("events", events, null),
      resource("collections", collections, null),
      resource("folders", folders, null),
      resource("storage", storageUsed, storageLimit),
    ],
    songs,
    members,
    pendingInvitations,
    services,
    activeServices,
    archivedServices,
    events,
    upcomingEvents,
    pastEvents,
    collections,
    folders,
    uniqueTags: tagSet.size,
    trashItems,
    estimatedDataBytes,
    browserUsageBytes,
    browserQuotaBytes,
    memberRoles,
  };
}
