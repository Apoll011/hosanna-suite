import type { AppRole } from "@hosanna/auth";
import { apiFetch } from "@/lib/services/api";

/**
 * Delivery channel for a single-user notification:
 *   - "inbox": in-app notification only.
 *   - "push":  FCM push to the user's registered devices.
 *   - "both":  in-app notification AND FCM push.
 * Org fan-out is always in-app only ("inbox").
 */
export type NotificationChannel = "inbox" | "push" | "both";

export type NotificationFcmMessage = {
  title?: string;
  body?: string;
  data?: Record<string, string>;
};

export type CreateNotificationInput = {
  userId?: string;
  organizationId?: string;
  roles?: AppRole[];
  type: string;
  title: string;
  description?: string;
  href?: string;
  channel?: NotificationChannel;
  fcm?: NotificationFcmMessage;
};

export type CreateNotificationResult = {
  ok: boolean;
  push?: {
    sent: number;
    invalidTokensPruned: number;
  };
};

export const notificationsApi = {
  create: (
    input: CreateNotificationInput,
    opts?: { organizationId?: string },
  ): Promise<CreateNotificationResult> =>
    apiFetch<CreateNotificationResult>("/notifications", {
      method: "POST",
      body: JSON.stringify(input),
      organizationId: opts?.organizationId ?? input.organizationId ?? null,
    }),
};
