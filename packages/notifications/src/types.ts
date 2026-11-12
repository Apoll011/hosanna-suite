/** Delivery channels supported by the unified notification system. */
export type NotificationChannel = "inbox" | "push" | "email";

export type NotificationCategory =
  "auth" | "billing" | "org" | "agenda" | "backup" | "product" | "security";

export type AppId = "musician" | "studio" | "auth" | "unknown";

export type PushPlatform = "android" | "ios" | "web" | "unknown";

export interface NotificationTypeDefinition {
  type: string;
  category: NotificationCategory;
  /** Default channels when the caller omits `channels`. */
  defaultChannels: NotificationChannel[];
  /** Channels the user may not disable (e.g. security email). */
  forcedChannels?: NotificationChannel[];
  /** Whether preference overrides are allowed. */
  userOverridable: boolean;
}

export interface PushOverride {
  title?: string;
  body?: string;
  data?: Record<string, string>;
}

export interface EmailOverride {
  subject?: string;
  template?: string;
  variables?: Record<string, unknown>;
  /** Raw HTML body when no template is used. */
  html?: string;
  text?: string;
}

export interface DispatchTarget {
  userId?: string;
  organizationId?: string;
  teamId?: string;
  /** Restrict org/team fan-out to these membership roles. */
  roles?: string[];
}

export interface DispatchInput extends DispatchTarget {
  type: string;
  title: string;
  body?: string;
  /** @deprecated Prefer `body`. Kept for API compatibility. */
  description?: string;
  href?: string;
  data?: Record<string, string>;
  /** Explicit channel list; omit to use type defaults + prefs. */
  channels?: NotificationChannel[];
  push?: PushOverride;
  email?: EmailOverride;
  /**
   * When true, skip preference merge and deliver exactly `channels`
   * (or type defaults). Used for security/auth mail.
   */
  bypassPreferences?: boolean;
}

export interface DispatchResult {
  ok: boolean;
  recipientCount: number;
  inbox: { created: number };
  push: { sent: number; invalidTokensPruned: number };
  email: { sent: number; failed: number };
}

export interface FcmMessage {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface FcmSendResult {
  ok: boolean;
  invalidToken: boolean;
  error?: string;
}

export interface FcmConfig {
  projectId?: string;
  clientEmail?: string;
  privateKey?: string;
}

export interface RegisterDeviceInput {
  userId: string;
  token: string;
  sessionId?: string | null;
  platform?: PushPlatform;
  appId?: AppId;
  enabled?: boolean;
}

export interface NotificationPreferenceInput {
  userId: string;
  type?: string | null;
  category?: string | null;
  inbox?: boolean;
  push?: boolean;
  email?: boolean;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
  timezone?: string | null;
}

export interface ResolvedChannels {
  inbox: boolean;
  push: boolean;
  email: boolean;
}

export interface InboxNotifyFn {
  (payload: {
    userId?: string;
    organizationId?: string;
    roles?: string[];
    type: string;
    title: string;
    body?: string;
    href?: string;
    data?: Record<string, unknown>;
  }): Promise<{ count?: number } | void>;
}

export interface EmailSendFn {
  (payload: {
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
    template?: string;
    variables?: Record<string, unknown>;
    locale?: string;
  }): Promise<void>;
}

export interface NotificationServiceDeps {
  /** Prisma client (shared DB). */
  prisma: any;
  fcm: FcmConfig;
  /** better-inbox notify (auth.api.notify). */
  inboxNotify: InboxNotifyFn;
  /** Optional email transport (Resend/templates). */
  sendEmail?: EmailSendFn;
  /** Resolve user email + locale for email channel. */
  resolveUserEmail?: (userId: string) => Promise<{ email: string; locale?: string } | null>;
}
