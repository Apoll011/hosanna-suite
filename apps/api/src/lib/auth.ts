import { createAuth, type AuthEmails } from "@hosanna/auth/server";
import Stripe from "stripe";
import { prisma } from "../database/prisma.js";
import { env } from "../config/env.js";
import { DEFAULT_LOCALE, t } from "./i18n.js";

export const stripeClient = new Stripe(env.stripeSecretKey, {
  // SDK types lag API versions; cast keeps a pinned Stripe API version.
  apiVersion: "2026-07-29.dahlia" as any,
});

/** Auth app owns login/reset/invite/billing mail — API never mounts the BA handler. */
const noopEmail = async () => undefined;
const emails: AuthEmails = {
  sendPasswordResetEmail: noopEmail,
  sendPasswordResetSuccessEmail: noopEmail,
  sendVerificationEmail: noopEmail,
  sendWelcomeEmail: noopEmail,
  sendAccountDeletedEmail: noopEmail,
  sendOtpEmail: noopEmail,
  sendChangeEmailVerificationEmail: noopEmail,
  sendChurchInvitationEmail: noopEmail,
  sendPromotedToAdminEmail: noopEmail,
  sendRoleChangedEmail: noopEmail,
  sendRemovedFromChurchEmail: noopEmail,
  sendTrialStartedEmail: noopEmail,
  sendTrialEndedEmail: noopEmail,
  sendTrialExpiredEmail: noopEmail,
  sendSubscribedEmail: noopEmail,
  sendCanceledEmail: noopEmail,
};

/**
 * Resource-server Better Auth instance (shared DB/Redis with the auth app).
 * Used for getSession + better-inbox notify — HTTP handler + mail stay on apps/auth.
 *
 * `baseURL` / issuer MUST be the auth app origin (`env.authIssuer`).
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
  emails,
  notifyOrg: async (payload) => {
    try {
      await auth.api.notify({ body: payload as any });
    } catch (err) {
      console.error("[api] org notification failed:", err);
    }
  },
  avatars: {
    isBase64Image: () => false,
    isExternalImageUrl: () => false,
    uploadBase64Avatar: async () => {
      throw new Error("Avatar uploads are handled by the auth app");
    },
    uploadUrlAvatar: async () => {
      throw new Error("Avatar uploads are handled by the auth app");
    },
  },
  t: (locale, key, vars) => t(locale, key as any, vars),
  defaultLocale: DEFAULT_LOCALE,
});
