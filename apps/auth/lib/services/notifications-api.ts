import type { AppRole } from "@hosanna/auth";
import { localApiFetch } from "@/lib/services/local-api";

export type NotificationChannel = "inbox" | "push" | "email";
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

export type NotificationPreference = {
  id: string;
  type: string | null;
  category: string | null;
  inbox: boolean;
  push: boolean;
  email: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  timezone: string | null;
};

export const notificationsApi = {
  create: (
    input: CreateNotificationInput,
    opts?: { organizationId?: string },
  ): Promise<CreateNotificationResult> =>
    localApiFetch<CreateNotificationResult>("/notifications", {
      method: "POST",
      body: JSON.stringify(input),
      organizationId: opts?.organizationId ?? input.organizationId ?? null,
    }),

  getPreferences: (): Promise<{
    preferences: NotificationPreference[];
    catalog: Array<{
      type: string;
      category: string;
      defaultChannels: NotificationChannel[];
      userOverridable: boolean;
    }>;
  }> => localApiFetch("/notifications/preferences"),

  updatePreference: (input: {
    type?: string | null;
    category?: string | null;
    inbox?: boolean;
    push?: boolean;
    email?: boolean;
    quietHoursStart?: string | null;
    quietHoursEnd?: string | null;
    timezone?: string | null;
  }): Promise<{ preference: NotificationPreference }> =>
    localApiFetch("/notifications/preferences", {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
};
