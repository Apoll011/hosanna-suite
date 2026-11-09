import { createAuth } from "@hosanna/auth/server";
import Stripe from "stripe";
import { env } from "../config/env.js";
import { prisma } from "../database/prisma.js";
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
import { notifyOrg } from "../utils/notify.js";
import { DEFAULT_LOCALE, t } from "./i18n.js";
import {
  isBase64Image,
  isExternalImageUrl,
  uploadBase64Avatar,
  uploadUrlAvatar,
} from "./supabase.js";

export const stripeClient = new Stripe(env.stripeSecretKey, {
  // Use 2026-07-29.dahlia to match incoming webhook events and avoid
  // FAILED_TO_CONSTRUCT_STRIPE_EVENT errors when Stripe sends events with
  // older API versions.
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error — SDK types only reflect latest API version; 2026-07-29.dahlia is valid.
  apiVersion: "2026-07-29.dahlia",
});

/**
 * When AUTH_URL is set, Better Auth's issuer/baseURL and UI deep links point at
 * the auth app. Session validation still uses this shared instance + Prisma.
 */
const authOrigin = (env.authUrl ?? env.publicAppUrl).replace(/\/+$/, "");
const authUiUrl = (env.authUrl ?? env.studioUrl).replace(/\/+$/, "");

export const auth = createAuth({
  prisma,
  stripeClient,
  config: {
    betterAuthSecret: env.betterAuthSecret,
    publicAppUrl: authOrigin,
    betterAuthApiKey: env.betterAuthApiKey,
    googleClientId: env.googleClientId,
    googleClientSecret: env.googleClientSecret,
    stripeWebhookSecret: env.stripeWebhookSecret,
    turnstileSecretKey: env.turnstileSecretKey,
    mcpResourceUrl: env.mcpResourceUrl,
    appUrl: authUiUrl,
    studioUrl: env.studioUrl,
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
    await notifyOrg({
      ...payload,
      roles: payload.roles as any,
    });
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
