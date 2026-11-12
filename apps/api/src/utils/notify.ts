import { createNotificationService, type DispatchInput } from "@hosanna/notifications";
import { roles } from "@hosanna/auth";
import { prisma } from "../database/prisma.js";
import { auth } from "../lib/auth.js";
import { env } from "../config/env.js";

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

const notifications = createNotificationService({
  prisma,
  fcm: {
    projectId: env.fcmProjectId,
    clientEmail: env.fcmClientEmail,
    privateKey: env.fcmPrivateKey,
  },
  inboxNotify: async (payload) => {
    const result = await auth.api.notify({
      body: {
        userId: payload.userId,
        organizationId: payload.organizationId,
        roles: payload.roles,
        type: payload.type,
        title: payload.title,
        ...(payload.body != null ? { body: payload.body } : {}),
        ...(payload.href != null ? { href: payload.href } : {}),
        ...(payload.data != null ? { data: payload.data } : {}),
      },
    });
    return { count: result?.count ?? 0 };
  },
});

export async function inboxNotify(payload: DispatchInput): Promise<{ count: number }> {
  const result = await notifications.dispatch({
    ...payload,
    channels: payload.channels ?? ["inbox"],
  });
  return { count: result.inbox.created };
}

export async function notifyOrg(payload: OrgNotifyPayload): Promise<void> {
  try {
    await notifications.notifyOrg({
      organizationId: payload.organizationId,
      roles: payload.roles,
      type: payload.type,
      title: payload.title,
      body: payload.description,
      href: payload.href,
    });
  } catch (err) {
    console.error("[notify] org notification failed:", err);
  }
}

export async function notifyUser(payload: UserNotifyPayload): Promise<void> {
  try {
    await notifications.notifyUser({
      userId: payload.userId,
      type: payload.type,
      title: payload.title,
      body: payload.description,
      href: payload.href,
    });
  } catch (err) {
    console.error("[notify] user notification failed:", err);
  }
}
