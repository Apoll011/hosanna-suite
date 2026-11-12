import { randomUUID } from "node:crypto";
import { getTypeDefinition } from "./catalog/types.js";
import type {
  NotificationChannel,
  NotificationPreferenceInput,
  ResolvedChannels,
} from "./types.js";

function channelsFromList(list: NotificationChannel[]): ResolvedChannels {
  return {
    inbox: list.includes("inbox"),
    push: list.includes("push"),
    email: list.includes("email"),
  };
}

function inQuietHours(
  pref: {
    quietHoursStart?: string | null;
    quietHoursEnd?: string | null;
    timezone?: string | null;
  },
  now = new Date(),
): boolean {
  const start = pref.quietHoursStart;
  const end = pref.quietHoursEnd;
  if (!start || !end) return false;

  try {
    const tz = pref.timezone || "UTC";
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(now);
    const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
    const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
    const current = `${hour}:${minute}`;

    if (start <= end) {
      return current >= start && current < end;
    }
    // Overnight window (e.g. 22:00 → 07:00)
    return current >= start || current < end;
  } catch {
    return false;
  }
}

/**
 * Merge type defaults, forced channels, caller overrides, and user prefs.
 */
export function resolveChannelsForUser(opts: {
  type: string;
  requested?: NotificationChannel[];
  preference?: {
    inbox?: boolean | null;
    push?: boolean | null;
    email?: boolean | null;
    quietHoursStart?: string | null;
    quietHoursEnd?: string | null;
    timezone?: string | null;
  } | null;
  bypassPreferences?: boolean;
  /** Override clock for quiet-hours checks (tests). */
  now?: Date;
}): ResolvedChannels {
  const def = getTypeDefinition(opts.type);
  const base = channelsFromList(opts.requested?.length ? opts.requested : def.defaultChannels);

  if (opts.bypassPreferences || !def.userOverridable) {
    for (const ch of def.forcedChannels ?? []) base[ch] = true;
    return base;
  }

  const pref = opts.preference;
  if (pref) {
    if (typeof pref.inbox === "boolean") base.inbox = pref.inbox;
    if (typeof pref.push === "boolean") base.push = pref.push;
    if (typeof pref.email === "boolean") base.email = pref.email;
    // Quiet hours suppress push + email (inbox still created).
    if (inQuietHours(pref, opts.now)) {
      base.push = false;
      base.email = false;
    }
  }

  for (const ch of def.forcedChannels ?? []) base[ch] = true;
  return base;
}

export async function getPreferencesForUsers(
  prisma: any,
  userIds: string[],
  type: string,
): Promise<Map<string, any>> {
  const def = getTypeDefinition(type);
  if (userIds.length === 0) return new Map();

  const rows = await prisma.notificationPreference.findMany({
    where: {
      userId: { in: userIds },
      OR: [{ type }, { category: def.category, type: null }, { type: null, category: null }],
    },
  });

  // Prefer type-specific > category > global
  const byUser = new Map<string, any>();
  const rank = (row: { type?: string | null; category?: string | null }) => {
    if (row.type === type) return 3;
    if (row.category === def.category) return 2;
    return 1;
  };

  for (const row of rows) {
    const prev = byUser.get(row.userId);
    if (!prev || rank(row) > rank(prev)) byUser.set(row.userId, row);
  }
  return byUser;
}

export async function upsertPreference(prisma: any, input: NotificationPreferenceInput) {
  const existing = await prisma.notificationPreference.findFirst({
    where: {
      userId: input.userId,
      type: input.type ?? null,
      category: input.category ?? null,
    },
  });

  const data = {
    inbox: input.inbox ?? true,
    push: input.push ?? true,
    email: input.email ?? false,
    quietHoursStart: input.quietHoursStart ?? null,
    quietHoursEnd: input.quietHoursEnd ?? null,
    timezone: input.timezone ?? null,
  };

  if (existing) {
    return prisma.notificationPreference.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.notificationPreference.create({
    data: {
      id: randomUUID(),
      userId: input.userId,
      type: input.type ?? null,
      category: input.category ?? null,
      ...data,
    },
  });
}

export async function listPreferences(prisma: any, userId: string) {
  return prisma.notificationPreference.findMany({
    where: { userId },
    orderBy: [{ category: "asc" }, { type: "asc" }],
  });
}
