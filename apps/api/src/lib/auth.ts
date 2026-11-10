import { createAuth } from "@hosanna/auth/server";
import Stripe from "stripe";
import { prisma } from "../database/prisma.js";
import { env } from "../config/env.js";
import { DEFAULT_LOCALE, t } from "./i18n.js";
import {
  isBase64Image,
  isExternalImageUrl,
  uploadBase64Avatar,
  uploadUrlAvatar,
} from "./supabase.js";
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
} from "../services/email.service.js";

export const stripeClient = new Stripe(env.stripeSecretKey, {
  // SDK types lag API versions; cast keeps a pinned Stripe API version.
  apiVersion: "2026-07-29.dahlia" as any,
});

/**
 * Resource-server Better Auth instance (shared DB/Redis with the auth app).
 * Used for getSession + better-inbox notify — HTTP handler stays on apps/auth.
 *
 * `baseURL` / issuer MUST be the auth app origin (`env.authUrl`).
 */
export const auth = createAuth({
  prisma,
  stripeClient,
  config: {
    betterAuthSecret: env.betterAuthSecret,
    publicAppUrl: env.authIssuer,
    betterAuthApiKey: env.betterAuthApiKey,
    googleClientId: env.googleClientId,
    googleClientSecret: env.googleClientSecret,
    stripeWebhookSecret: env.stripeWebhookSecret,
    turnstileSecretKey: env.turnstileSecretKey,
    mcpResourceUrl: env.mcpResourceUrl,
    appUrl: env.authIssuer,
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
      console.error("[api] org notification failed:", err);
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
