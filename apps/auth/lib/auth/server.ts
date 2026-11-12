import { createAuth } from "@hosanna/auth/server";
import Stripe from "stripe";
import { env } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import {
  handleSessionRevoked,
  getNotificationService,
  setInboxNotify,
} from "@/lib/notifications/service";
import {
  sendAccountDeletedEmail,
  sendCanceledEmail,
  sendChangeEmailVerificationEmail,
  sendChurchInvitationEmail,
  sendOtpEmail,
  sendPasswordResetEmail,
  sendPasswordResetSuccessEmail,
  sendPromotedToAdminEmail,
  sendRemovedFromChurchEmail,
  sendRoleChangedEmail,
  sendSubscribedEmail,
  sendTrialEndedEmail,
  sendTrialExpiredEmail,
  sendTrialStartedEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from "@/lib/services/email";
import { DEFAULT_LOCALE, t } from "@/locales/server";
import {
  isBase64Image,
  isExternalImageUrl,
  uploadBase64Avatar,
  uploadUrlAvatar,
} from "@/lib/db/supabase";

export const stripeClient = new Stripe(env.stripeSecretKey, {
  // SDK types lag API versions; cast keeps a pinned Stripe API version.
  apiVersion: "2026-07-29.dahlia" as any,
});

/**
 * Auth app owns the Better Auth HTTP surface. Deep links and MCP login/consent
 * point at this same origin (`env.authUrl`).
 */
export const auth = createAuth({
  prisma,
  stripeClient,
  config: {
    betterAuthSecret: env.betterAuthSecret,
    publicAppUrl: env.publicAppUrl,
    betterAuthApiKey: env.betterAuthApiKey,
    googleClientId: env.googleClientId,
    googleClientSecret: env.googleClientSecret,
    stripeWebhookSecret: env.stripeWebhookSecret,
    turnstileSecretKey: env.turnstileSecretKey,
    mcpResourceUrl: env.mcpResourceUrl,
    mcpExtraResourceUrls: env.mcpExtraResourceUrls,
    appUrl: env.authUrl,
    studioUrl: env.studioUrl,
    redisUrl: env.redisUrl,
  },
  emails: {
    sendPasswordResetEmail,
    sendPasswordResetSuccessEmail,
    sendVerificationEmail,
    sendWelcomeEmail,
    sendAccountDeletedEmail,
    sendOtpEmail,
    sendChangeEmailVerificationEmail,
    sendChurchInvitationEmail,
    sendPromotedToAdminEmail,
    sendRoleChangedEmail,
    sendRemovedFromChurchEmail,
    sendTrialStartedEmail,
    sendTrialEndedEmail,
    sendTrialExpiredEmail,
    sendSubscribedEmail,
    sendCanceledEmail,
  },
  notifyOrg: async (payload) => {
    try {
      // Multi-channel fan-out via unified notification service (type defaults + prefs).
      await getNotificationService().notifyOrg({
        organizationId: payload.organizationId,
        roles: payload.roles,
        type: payload.type,
        title: payload.title,
        body: payload.description,
        href: payload.href,
      });
    } catch (err) {
      console.error("[auth-app] org notification failed:", err);
    }
  },
  onSessionRevoked: handleSessionRevoked,
  avatars: {
    isBase64Image,
    isExternalImageUrl,
    uploadBase64Avatar,
    uploadUrlAvatar,
  },
  t: (locale, key, vars) => t(locale, key as any, vars),
  defaultLocale: DEFAULT_LOCALE,
});

// Wire better-inbox after auth exists (breaks circular init with notifyOrg).
setInboxNotify(async (payload) => {
  const result = await auth.api.notify({ body: payload as any });
  return { count: (result as { count?: number } | null)?.count };
});
