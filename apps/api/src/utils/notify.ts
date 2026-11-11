import { roles } from "@hosanna/auth";
import { prisma } from "../database/prisma.js";
import { auth } from "../lib/auth.js";
import { sendFcmToToken, type FcmMessage } from "../lib/fcm.js";

type OrgRole = keyof typeof roles;

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
  data?: Record<string, unknown>;
};

/** Write inbox rows via better-inbox on the local Better Auth instance. */
export async function inboxNotify(payload: NotifyBody): Promise<{ count: number }> {
  const body = payload.body ?? payload.description;
  const result = await auth.api.notify({
    body: {
      userId: payload.userId,
      organizationId: payload.organizationId,
      roles: payload.roles,
      type: payload.type,
      title: payload.title,
      ...(body != null ? { body } : {}),
      ...(payload.href != null ? { href: payload.href } : {}),
      ...(payload.data != null ? { data: payload.data } : {}),
    },
  });
  return { count: result?.count ?? 0 };
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
