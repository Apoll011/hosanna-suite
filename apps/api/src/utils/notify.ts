import { randomUUID } from "node:crypto";
import { roles } from "@hosanna/auth";
import { prisma } from "../database/prisma.js";
import { sendFcmToToken, type FcmMessage } from "../lib/fcm.js";

type OrgRole = keyof typeof roles;

const MAX_FANOUT = 1_000;

export interface OrgNotifyPayload {
  organizationId: string;
  roles?: OrgRole[];
  type: string;
  title: string;
  description?: string;
  href?: string;
}

export interface UserNotifyPayload {
  userId: string;
  type: string;
  title: string;
  description?: string;
  href?: string;
}

export interface FcmUserSendResult {
  sent: number;
  invalidTokens: number;
}

type NotifyBody = {
  userId?: string;
  organizationId?: string;
  roles?: OrgRole[];
  type: string;
  title: string;
  description?: string;
  body?: string;
  href?: string;
  data?: unknown;
};

async function createNotificationRow(input: {
  userId: string;
  organizationId?: string;
  type: string;
  title: string;
  body?: string | null;
  href?: string | null;
  data?: unknown;
}) {
  return prisma.notification.create({
    data: {
      id: randomUUID(),
      userId: input.userId,
      organizationId: input.organizationId ?? null,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      href: input.href ?? null,
      data: input.data === undefined ? undefined : (input.data as never),
      read: false,
      createdAt: new Date(),
    },
  });
}

/** Write inbox rows the same way better-inbox `notify` does — no Better Auth instance. */
export async function inboxNotify(payload: NotifyBody): Promise<{ count: number }> {
  const body = payload.body ?? payload.description ?? null;
  const { userId, organizationId, roles: roleFilter, type, title, href, data } = payload;

  if (!!userId === !!organizationId) {
    throw new Error("Provide exactly one of userId or organizationId");
  }

  if (!organizationId) {
    await createNotificationRow({
      userId: userId!,
      type,
      title,
      body,
      href,
      data,
    });
    return { count: 1 };
  }

  const members = await prisma.member.findMany({
    where: {
      organizationId,
      ...(roleFilter?.length ? { role: { in: roleFilter.map((r) => r.toLowerCase()) } } : {}),
    },
    select: { userId: true },
    take: MAX_FANOUT + 1,
  });

  if (members.length > MAX_FANOUT) {
    throw new Error(`Organization fan-out exceeds max of ${MAX_FANOUT} members`);
  }

  await prisma.$transaction(
    members.map((m) =>
      prisma.notification.create({
        data: {
          id: randomUUID(),
          userId: m.userId,
          organizationId,
          type,
          title,
          body,
          href: href ?? null,
          data: data === undefined ? undefined : (data as never),
          read: false,
          createdAt: new Date(),
        },
      }),
    ),
  );

  return { count: members.length };
}

export async function notifyOrg(payload: OrgNotifyPayload): Promise<void> {
  try {
    await inboxNotify(payload);
  } catch (err) {
    console.error("[notify] org notification failed:", err);
  }
}

export async function notifyUser(payload: UserNotifyPayload): Promise<void> {
  try {
    await inboxNotify(payload);
  } catch (err) {
    console.error("[notify] user notification failed:", err);
  }
}

export async function sendFcmToUser(
  userId: string,
  message: FcmMessage,
): Promise<FcmUserSendResult> {
  const result: FcmUserSendResult = { sent: 0, invalidTokens: 0 };
  try {
    const sessions = await prisma.session.findMany({
      where: { userId, notify: true, fcm: { not: null } },
      select: { id: true, fcm: true },
    });
    if (sessions.length === 0) return result;

    const deadSessionIds: string[] = [];
    await Promise.all(
      sessions.map(async (session) => {
        const outcome = await sendFcmToToken(session.fcm!, message);
        if (outcome.ok) {
          result.sent++;
        } else if (outcome.invalidToken) {
          deadSessionIds.push(session.id);
        }
      }),
    );

    if (deadSessionIds.length > 0) {
      await prisma.session
        .updateMany({
          where: { id: { in: deadSessionIds } },
          data: { fcm: null },
        })
        .catch(() => undefined);
      result.invalidTokens = deadSessionIds.length;
    }

    return result;
  } catch (err) {
    console.error("[notify] fcm push failed:", err);
    return result;
  }
}
