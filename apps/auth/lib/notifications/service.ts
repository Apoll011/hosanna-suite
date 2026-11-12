import {
  createNotificationService,
  revokeDevicesForSession,
  type NotificationService,
} from "@hosanna/notifications";
import { env } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import { sendTemplateEmail, sendEmail } from "@/lib/services/email";

let cached: NotificationService | null = null;
let inboxNotifyRef: ((payload: any) => Promise<{ count?: number } | void>) | null = null;

/** Wire better-inbox notify once auth is constructed (avoids circular init). */
export function setInboxNotify(fn: (payload: any) => Promise<{ count?: number } | void>): void {
  inboxNotifyRef = fn;
  cached = null;
}

export function getNotificationService(): NotificationService {
  if (cached) return cached;

  cached = createNotificationService({
    prisma,
    fcm: {
      projectId: env.fcmProjectId,
      clientEmail: env.fcmClientEmail,
      privateKey: env.fcmPrivateKey,
    },
    inboxNotify: async (payload) => {
      if (!inboxNotifyRef) {
        throw new Error("Inbox notify is not wired yet.");
      }
      return inboxNotifyRef(payload);
    },
    sendEmail: async ({ to, subject, html, text, template, variables, locale }) => {
      if (template) {
        await sendTemplateEmail({
          to,
          template,
          variables: (variables ?? {}) as Record<string, any>,
          subject,
          locale,
        });
        return;
      }
      await sendEmail({
        to,
        subject,
        html: html ?? `<p>${text ?? ""}</p>`,
        text,
      });
    },
    resolveUserEmail: async (userId) => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, metadata: true },
      });
      if (!user?.email) return null;
      let locale: string | undefined;
      try {
        const meta = typeof user.metadata === "string" ? JSON.parse(user.metadata) : user.metadata;
        locale = meta?.locale ?? meta?.settings?.locale;
      } catch {
        /* ignore */
      }
      return { email: user.email, locale };
    },
  });

  return cached;
}

export async function handleSessionRevoked(session: { id: string; userId: string }): Promise<void> {
  await revokeDevicesForSession(prisma, session.id);
}
