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
import {
  isBase64Image,
  isExternalImageUrl,
  uploadBase64Avatar,
  uploadUrlAvatar,
} from "./supabase";

export const stripeClient = new Stripe(env.stripeSecretKey, {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error — SDK types only reflect latest API version; 2026-07-29.dahlia is valid.
  apiVersion: "2026-07-29.dahlia",
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
    appUrl: env.authUrl,
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
