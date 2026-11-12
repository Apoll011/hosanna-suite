import type { AppRole } from "@hosanna/auth";
import { authApiFetch } from "./authApi";

/** Multi-channel delivery (new unified system). */
export type NotificationChannel = "inbox" | "push" | "email";

/** Legacy single-user channel enum still accepted by the server. */
export type LegacyNotificationChannel = "inbox" | "push" | "both";

export type NotificationFcmMessage = {
  title?: string;
  body?: string;
  data?: Record<string, string>;
};

export type CreateNotificationInput = {
  userId?: string;
  organizationId?: string;
  teamId?: string;
  roles?: AppRole[];
  type: string;
  title: string;
  description?: string;
  body?: string;
  href?: string;
  data?: Record<string, string>;
  channel?: LegacyNotificationChannel;
  channels?: NotificationChannel[];
  fcm?: NotificationFcmMessage;
  push?: NotificationFcmMessage;
  email?: {
    subject?: string;
    template?: string;
    variables?: Record<string, unknown>;
    html?: string;
    text?: string;
  };
};

export type CreateNotificationResult = {
  ok: boolean;
  recipientCount?: number;
  inbox?: { created: number };
  push?: {
    sent: number;
    invalidTokensPruned: number;
  };
  email?: { sent: number; failed: number };
};

export type NotificationType =
  | "assignment_created"
  | "assignment_removed"
  | "event_cancelled"
  | "service_date_changed"
  | "service_location_changed"
  | "service_updated";

export type NotificationRecipientInput = {
  userId: string;
  data?: Record<string, string>;
  description?: string;
};

export type SendNotificationsInput = {
  type: NotificationType;
  recipients: NotificationRecipientInput[];
  title: string;
  description?: string;
  href?: string;
  data?: Record<string, string>;
};

export type SendNotificationsResult = {
  sent: number;
  failed: { userId: string; error: string }[];
  succeededUserIds: string[];
};

export const notificationsApi = {
  async create(input: CreateNotificationInput): Promise<CreateNotificationResult> {
    return authApiFetch<CreateNotificationResult>("/notifications", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async send(input: SendNotificationsInput): Promise<SendNotificationsResult> {
    const shared = input.data ?? {};

    const settled = await Promise.all(
      input.recipients.map(async (recipient) => {
        const fcmData = { ...shared, ...(recipient.data ?? {}) };
        try {
          await notificationsApi.create({
            userId: recipient.userId,
            type: input.type,
            title: input.title,
            description: recipient.description ?? input.description,
            ...(input.href ? { href: input.href } : {}),
            channels: ["inbox", "push"],
            ...(Object.keys(fcmData).length > 0 ? { push: { data: fcmData } } : {}),
          });
          return { userId: recipient.userId, ok: true as const, error: "" };
        } catch (err) {
          return {
            userId: recipient.userId,
            ok: false as const,
            error: err instanceof Error && err.message ? err.message : "notification failed",
          };
        }
      }),
    );

    const succeededUserIds = settled.filter((r) => r.ok).map((r) => r.userId);
    return {
      sent: succeededUserIds.length,
      failed: settled.filter((r) => !r.ok).map((r) => ({ userId: r.userId, error: r.error })),
      succeededUserIds,
    };
  },
};
