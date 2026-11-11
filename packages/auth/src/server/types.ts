import type { PrismaClient } from "@hosanna/db";
import type Stripe from "stripe";

export interface AuthOrgNotifyPayload {
  organizationId: string;
  roles?: string[];
  type: string;
  title: string;
  description?: string;
  href?: string;
}

export interface AuthEmailUser {
  email: string;
  name: string;
}

/** Email senders used by Better Auth hooks (injected by the auth app). */
export interface AuthEmails {
  sendPasswordResetEmail: (
    to: string,
    vars: { name: string; url: string; expireMinutes: number },
  ) => Promise<unknown>;
  sendPasswordResetSuccessEmail: (to: string, vars: { first_name: string }) => Promise<unknown>;
  sendVerificationEmail: (
    to: string,
    vars: { name: string; url: string; expireMinutes: number },
  ) => Promise<unknown>;
  sendWelcomeEmail: (
    to: string,
    vars: {
      first_name: string;
      organizationName?: string;
      dashboardUrl?: string;
      locale?: string;
    },
  ) => Promise<unknown>;
  sendAccountDeletedEmail: (to: string, vars: { first_name: string }) => Promise<unknown>;
  sendOtpEmail: (
    to: string,
    vars: { name: string; otp: string; expireMinutes: number },
  ) => Promise<unknown>;
  sendChangeEmailVerificationEmail: (
    to: string,
    vars: { first_name: string; new_email: string; confirm_email_link: string },
  ) => Promise<unknown>;
  sendChurchInvitationEmail: (
    to: string,
    vars: {
      church_name: string;
      inviter_name: string;
      invite_link: string;
      locale?: string;
    },
  ) => Promise<unknown>;
  sendPromotedToAdminEmail: (
    to: string,
    vars: {
      first_name: string;
      church_name: string;
      workspace_settings_url: string;
      locale?: string;
    },
  ) => Promise<unknown>;
  sendRoleChangedEmail: (
    to: string,
    vars: {
      first_name: string;
      church_name: string;
      new_role: string;
      locale?: string;
    },
  ) => Promise<unknown>;
  sendRemovedFromChurchEmail: (
    to: string,
    vars: { first_name: string; church_name: string; locale?: string },
  ) => Promise<unknown>;
  sendTrialStartedEmail: (
    to: string,
    vars: {
      first_name: string;
      church_name: string;
      plan: string;
      locale?: string;
    },
  ) => Promise<unknown>;
  sendTrialEndedEmail: (
    to: string,
    vars: {
      first_name: string;
      church_name: string;
      plan: string;
      locale?: string;
    },
  ) => Promise<unknown>;
  sendTrialExpiredEmail: (
    to: string,
    vars: {
      first_name: string;
      church_name: string;
      plan: string;
      locale?: string;
    },
  ) => Promise<unknown>;
  sendSubscribedEmail: (
    to: string,
    vars: {
      first_name: string;
      church_name: string;
      plan: string;
      locale?: string;
    },
  ) => Promise<unknown>;
  sendCanceledEmail: (
    to: string,
    vars: {
      first_name: string;
      church_name: string;
      plan: string;
      locale?: string;
    },
  ) => Promise<unknown>;
}

export interface AuthAvatarHelpers {
  isBase64Image: (value: string) => boolean;
  isExternalImageUrl: (value: string) => boolean;
  uploadBase64Avatar: (userId: string, base64: string) => Promise<string>;
  uploadUrlAvatar: (userId: string, imageUrl: string) => Promise<string>;
}

/** Shared Redis secondary-storage adapter shape (Better Auth). */
export type AuthSecondaryStorage = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, ttl?: number) => Promise<void>;
  delete: (key: string) => Promise<void>;
  getAndDelete: (key: string) => Promise<string | null>;
  increment: (key: string, ttl?: number) => Promise<number>;
};

/**
 * Slim config for resource servers (API): getSession + inbox notify + JWKS.
 * No Stripe / Google / Turnstile / mail / MCP login surface.
 */
export interface CreateAuthSlimConfig {
  betterAuthSecret: string;
  /** Better Auth baseURL / issuer — must be the auth app origin. */
  publicAppUrl: string;
  /** Extra trusted origins merged with the built-in Hosanna / MCP list. */
  trustedOriginsExtra?: string[];
  /**
   * Shared Redis URL for Better Auth secondary storage (sessions / rate limits).
   * Same instance as the API `@hosanna/cache` REDIS_URL — different key namespaces.
   */
  redisUrl?: string;
}

/** Full config for the auth app HTTP handler. */
export interface CreateAuthConfig extends CreateAuthSlimConfig {
  betterAuthApiKey?: string;
  googleClientId: string;
  googleClientSecret: string;
  stripeWebhookSecret: string;
  turnstileSecretKey: string;
  /**
   * Primary MCP resource identifier (audience). Also used for auth-host
   * protected-resource metadata when Better Auth serves it.
   */
  mcpResourceUrl: string;
  /**
   * Extra MCP resource audiences this AS may issue tokens for
   * (e.g. `https://dev-api.hosanna.live/mcp` when prod auth backs both APIs).
   * Seeded into `resources` + `clientRegistrationDefaultResources` so CIMD
   * clients like ChatGPT get linked on the next authorize.
   */
  mcpExtraResourceUrls?: string[];
  /**
   * UI origin for deep links (login, reset, invite, consent error pages).
   * After migration this is the auth app URL (same as publicAppUrl).
   */
  appUrl: string;
  /**
   * Post-login product URL used in welcome emails / settings deep links.
   * Defaults to appUrl when omitted.
   */
  studioUrl?: string;
}

export interface CreateAuthSlimOptions {
  mode: "slim";
  prisma: PrismaClient;
  config: CreateAuthSlimConfig;
  /**
   * Optional Better Auth secondary storage. When omitted, created from
   * `config.redisUrl` / `REDIS_URL` via `@hosanna/cache`.
   */
  secondaryStorage?: AuthSecondaryStorage | null;
}

export interface CreateAuthFullOptions {
  /** Default when omitted — auth app HTTP surface. */
  mode?: "full";
  prisma: PrismaClient;
  stripeClient: Stripe;
  config: CreateAuthConfig;
  emails: AuthEmails;
  notifyOrg: (payload: AuthOrgNotifyPayload) => Promise<void>;
  avatars: AuthAvatarHelpers;
  /** Server i18n helper for notification title/description strings. */
  t: (locale: string, key: string, vars?: Record<string, string>) => string;
  defaultLocale?: string;
  /**
   * Optional Better Auth secondary storage. When omitted, created from
   * `config.redisUrl` / `REDIS_URL` via `@hosanna/cache`.
   */
  secondaryStorage?: AuthSecondaryStorage | null;
}

export type CreateAuthOptions = CreateAuthFullOptions | CreateAuthSlimOptions;
