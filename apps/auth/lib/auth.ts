import { createAuth } from "@hosanna/auth/server";
import Stripe from "stripe";
import { env } from "./env";
import { prisma } from "./prisma";
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
} from "./email.service";
import { DEFAULT_LOCALE, t } from "@/locales/server";
import { isBase64Image, isExternalImageUrl, uploadBase64Avatar, uploadUrlAvatar } from "./supabase";

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
      await auth.api.notify({ body: payload as any });
    } catch (err) {
      console.error("[auth-app] org notification failed:", err);
    }
  },
  avatars: {
    isBase64Image,
    isExternalImageUrl,
    uploadBase64Avatar,
    uploadUrlAvatar,
  },
  t: (locale, key, vars) => t(locale, key as any, vars),
  defaultLocale: DEFAULT_LOCALE,
});
