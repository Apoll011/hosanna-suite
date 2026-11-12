import { randomUUID } from "node:crypto";
import type { RegisterDeviceInput } from "./types.js";

/**
 * Upsert a push device by FCM token.
 * Ensures a token belongs to at most one row (unique token).
 */
export async function registerPushDevice(prisma: any, input: RegisterDeviceInput) {
  const token = input.token.trim();
  if (!token) throw new Error("Push token is required.");

  const now = new Date();
  const enabled = input.enabled ?? true;

  const existing = await prisma.pushDevice.findUnique({ where: { token } });
  if (existing) {
    return prisma.pushDevice.update({
      where: { token },
      data: {
        userId: input.userId,
        sessionId: input.sessionId ?? existing.sessionId,
        platform: input.platform ?? existing.platform,
        appId: input.appId ?? existing.appId,
        enabled,
        lastSeenAt: now,
      },
    });
  }

  return prisma.pushDevice.create({
    data: {
      id: randomUUID(),
      userId: input.userId,
      token,
      sessionId: input.sessionId ?? null,
      platform: input.platform ?? "unknown",
      appId: input.appId ?? "unknown",
      enabled,
      lastSeenAt: now,
    },
  });
}

/** Disable / detach devices bound to a session (logout / revoke). */
export async function revokeDevicesForSession(prisma: any, sessionId: string): Promise<number> {
  const result = await prisma.pushDevice.updateMany({
    where: { sessionId },
    data: { enabled: false, sessionId: null },
  });
  return result.count;
}

/** Disable a specific token for a user. */
export async function disablePushDevice(
  prisma: any,
  opts: { userId: string; token?: string; deviceId?: string },
): Promise<number> {
  const where: Record<string, unknown> = { userId: opts.userId };
  if (opts.token) where.token = opts.token;
  if (opts.deviceId) where.id = opts.deviceId;
  const result = await prisma.pushDevice.updateMany({
    where,
    data: { enabled: false },
  });
  return result.count;
}

/** Delete dead FCM tokens. */
export async function deletePushDevicesByIds(prisma: any, ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;
  const result = await prisma.pushDevice.deleteMany({ where: { id: { in: ids } } });
  return result.count;
}

/** Enabled devices for a set of users, deduped by token. */
export async function listEnabledDevicesForUsers(prisma: any, userIds: string[]) {
  if (userIds.length === 0) return [] as Array<{ id: string; userId: string; token: string }>;
  const devices = await prisma.pushDevice.findMany({
    where: { userId: { in: userIds }, enabled: true },
    select: { id: true, userId: true, token: true },
  });
  const seen = new Set<string>();
  const unique: Array<{ id: string; userId: string; token: string }> = [];
  for (const d of devices) {
    if (seen.has(d.token)) continue;
    seen.add(d.token);
    unique.push(d);
  }
  return unique;
}

/**
 * One-time migration helper: copy Session.fcm (+ notify) into PushDevice.
 * Idempotent — skips tokens that already exist.
 */
export async function migrateSessionFcmToDevices(prisma: any): Promise<{ migrated: number }> {
  const sessions = await prisma.session.findMany({
    where: { fcm: { not: null }, notify: true },
    select: { id: true, userId: true, fcm: true },
  });

  let migrated = 0;
  for (const session of sessions) {
    if (!session.fcm) continue;
    const existing = await prisma.pushDevice.findUnique({ where: { token: session.fcm } });
    if (existing) continue;
    await prisma.pushDevice.create({
      data: {
        id: randomUUID(),
        userId: session.userId,
        token: session.fcm,
        sessionId: session.id,
        platform: "unknown",
        appId: "musician",
        enabled: true,
        lastSeenAt: new Date(),
      },
    });
    migrated++;
  }
  return { migrated };
}
