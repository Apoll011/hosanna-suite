import { cimd } from "@better-auth/cimd";
import { fetchClientMetadataResource } from "@better-auth/cimd/node";
import { i18n, locales } from "@better-auth/i18n";
import { dash, sentinel } from "@better-auth/infra";
import { mcp } from "@better-auth/mcp";
import { stripe } from "@better-auth/stripe";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { betterAuth } from "better-auth/minimal";
import {
  admin,
  bearer,
  captcha,
  haveIBeenPwned,
  jwt,
  organization,
  twoFactor,
} from "better-auth/plugins";
import { inbox } from "better-inbox";
import { createSecondaryStorage } from "@hosanna/cache";
import { roles } from "../authorization/roles.js";
import { pluginLocaleOverrides } from "../i18n/plugin-locale-overrides.js";
import { RESPONSIBILITIES } from "../authorization/responsibilities.js";
import type {
  AuthSecondaryStorage,
  CreateAuthFullOptions,
  CreateAuthOptions,
  CreateAuthSlimOptions,
} from "./types.js";

export type {
  CreateAuthOptions,
  CreateAuthFullOptions,
  CreateAuthSlimOptions,
  AuthEmails,
  AuthAvatarHelpers,
  CreateAuthConfig,
  CreateAuthSlimConfig,
  AuthOrgNotifyPayload,
  AuthSecondaryStorage,
} from "./types.js";

const TRUSTED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "https://*.hosanna.live",
  "https://hosanna.live",
  "hosanna://localhost",
  // External MCP hosts (Claude / ChatGPT / Cursor) — browser DCR + redirects
  "https://claude.ai",
  "https://www.claude.ai",
  "https://chatgpt.com",
  "https://chat.openai.com",
  "https://*.openai.com",
  "https://cursor.com",
  "https://*.cursor.com",
  "https://*.cursor.sh",
] as const;

function resolveSecondaryStorage(
  option: AuthSecondaryStorage | null | undefined,
  redisUrl: string | undefined,
): AuthSecondaryStorage | undefined {
  if (option === null) return undefined;
  if (option) return option;
  return createSecondaryStorage({ redisUrl: redisUrl ?? process.env.REDIS_URL }) ?? undefined;
}

function sharedSessionAndCookies(secondaryStorage: AuthSecondaryStorage | undefined) {
  return {
    advanced: {
      ipAddress: {
        ipAddressHeaders: ["cf-connecting-ip", "x-forwarded-for"],
      },
      cookiePrefix: "hosanna",
      // Studio (studio.hosanna.live) and API are different origins; SameSite=None
      // + Secure is required for credentialed cross-origin requests. CSRF is
      // still covered by Better Auth origin checks + trustedOrigins.
      defaultCookieAttributes: {
        sameSite: "none" as const,
        secure: true,
        httpOnly: true,
      },
      crossSubDomainCookies: {
        enabled: true,
        domain: "hosanna.live",
      },
      database: {
        joins: true,
      },
    },
    session: {
      freshAge: 0,
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
      // Keep Postgres as source of truth; Redis is a hot cache across auth isolates.
      ...(secondaryStorage
        ? {
            storeSessionInDatabase: true,
            preserveSessionInDatabase: true,
          }
        : {}),
      cookieCache: {
        enabled: true,
        strategy: "jwe" as const,
        maxAge: 15 * 60,
        version: "1",
      },
      additionalFields: {
        fcm: {
          type: "string" as const,
          required: false,
        },
        notify: {
          type: "boolean" as const,
          defaultValue: false,
        },
      },
    },
    rateLimit: {
      enabled: true,
      ...(secondaryStorage ? { storage: "secondary-storage" as const } : {}),
      window: 60,
      max: 100,
    },
  };
}

/**
 * Resource-server Better Auth: getSession, bearer, JWKS, org session fields, inbox notify.
 * No Stripe / Google / Turnstile / mail / MCP login / sentinel / captcha.
 */
function createSlimAuth(options: CreateAuthSlimOptions): any {
  const { prisma, config, secondaryStorage: secondaryStorageOption } = options;
  const secondaryStorage = resolveSecondaryStorage(secondaryStorageOption, config.redisUrl);
  const shared = sharedSessionAndCookies(secondaryStorage);

  return betterAuth({
    secret: config.betterAuthSecret,
    baseURL: config.publicAppUrl,
    appName: "Hosanna",
    database: prismaAdapter(prisma, {
      provider: "postgresql",
    }),
    ...(secondaryStorage ? { secondaryStorage } : {}),
    trustedOrigins: [...TRUSTED_ORIGINS, ...(config.trustedOriginsExtra ?? [])],
    // Password auth stays registered so schema/session shape matches the auth app;
    // send hooks are omitted — the auth app owns mail.
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      autoSignIn: false,
    },
    plugins: [
      inbox(),
      bearer(),
      jwt(),
      organization({
        organizationLimit: 1,
        membershipLimit: 500,
        teams: {
          enabled: true,
          maximumTeams: 50,
        },
        roles,
      }),
    ],
    user: {
      additionalFields: {
        metadata: {
          type: "string",
          required: false,
        },
      },
    },
    ...shared,
  });
}

function createFullAuth(options: CreateAuthFullOptions): any {
  const {
    prisma,
    stripeClient,
    config,
    emails,
    notifyOrg,
    avatars,
    t,
    defaultLocale = "pt-PT",
    secondaryStorage: secondaryStorageOption,
  } = options;

  const appUrl = config.appUrl.replace(/\/+$/, "");
  const studioUrl = (config.studioUrl ?? config.appUrl).replace(/\/+$/, "");

  const secondaryStorage = resolveSecondaryStorage(secondaryStorageOption, config.redisUrl);
  const shared = sharedSessionAndCookies(secondaryStorage);

  /** Reads the locale configured in an organisation's settings metadata. */
  async function getOrgLocale(organizationId: string): Promise<string> {
    try {
      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { metadata: true },
      });
      let meta: any = {};
      if (typeof org?.metadata === "string") {
        try {
          meta = JSON.parse(org.metadata);
        } catch {
          /* ignore */
        }
      } else if (org?.metadata && typeof org.metadata === "object") {
        meta = org.metadata as any;
      }
      const locale = meta?.settings?.general?.locale ?? meta?.locale;
      if (typeof locale === "string" && locale.length > 0) return locale;
    } catch {
      /* non-fatal */
    }
    return defaultLocale;
  }

  async function isOrgOwner(userId: string, organizationId: string) {
    const member = await prisma.member.findFirst({
      where: { organizationId, userId },
      select: { role: true },
    });
    return member?.role === "owner";
  }

  async function isOrgMember(userId: string, organizationId: string) {
    const member = await prisma.member.findFirst({
      where: { organizationId, userId },
      select: { id: true },
    });
    return member !== null;
  }

  /**
   * Returns the org display name, locale, and emails/names of members with the
   * given roles in a single DB query, used to fan out billing emails.
   */
  async function getOrgRecipientsWithLocale(
    organizationId: string,
    memberRoles: string[],
  ): Promise<{
    churchName: string;
    recipients: Array<{ email: string; name: string }>;
    locale: string;
  }> {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        name: true,
        metadata: true,
        members: {
          where: { role: { in: memberRoles } },
          select: { user: { select: { email: true, name: true } } },
        },
      },
    });

    let locale = defaultLocale;
    try {
      let meta: any = {};
      if (typeof org?.metadata === "string") {
        try {
          meta = JSON.parse(org.metadata);
        } catch {
          /* ignore */
        }
      } else if (org?.metadata && typeof org.metadata === "object") {
        meta = org.metadata as any;
      }
      const parsed = meta?.settings?.general?.locale ?? meta?.locale;
      if (typeof parsed === "string" && parsed.length > 0) locale = parsed;
    } catch {
      /* non-fatal */
    }

    return {
      churchName: org?.name ?? "Hosanna",
      recipients: org?.members?.map((m) => m.user) ?? [],
      locale,
    };
  }

  return betterAuth({
    secret: config.betterAuthSecret,
    baseURL: config.publicAppUrl,
    appName: "Hosanna",
    database: prismaAdapter(prisma, {
      provider: "postgresql",
    }),
    ...(secondaryStorage ? { secondaryStorage } : {}),
    trustedOrigins: [...TRUSTED_ORIGINS, ...(config.trustedOriginsExtra ?? [])],
    // OAuth cancel/callback failures must land in Studio, not Better Auth's
    // built-in /api/auth/error page (dev-only UX).
    onAPIError: {
      errorURL: `${appUrl.replace(/\/+$/, "")}/auth/error`,
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      resetPasswordTokenExpiresIn: 60 * 60,
      revokeSessionsOnPasswordReset: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      autoSignIn: false,

      sendResetPassword: async ({ user, url, token }, request) => {
        try {
          const resetUrl = `${appUrl}/reset-password/?token=${token}`;
          await emails.sendPasswordResetEmail(user.email, {
            name: user.name,
            url: resetUrl,
            expireMinutes: 60,
          });
        } catch (err) {
          console.error("[auth] Failed to send password reset email:", err);
        }
      },
      onPasswordReset: async ({ user }, request) => {
        try {
          await emails.sendPasswordResetSuccessEmail(user.email, {
            first_name: user.name,
          });
        } catch (err) {
          console.error("[auth] Failed to send password reset success email:", err);
        }
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user, context) => {
            if (user.image && typeof user.image === "string") {
              try {
                let publicUrl: string | undefined;
                if (avatars.isBase64Image(user.image)) {
                  publicUrl = await avatars.uploadBase64Avatar(user.id, user.image);
                } else if (avatars.isExternalImageUrl(user.image)) {
                  publicUrl = await avatars.uploadUrlAvatar(user.id, user.image);
                }

                if (publicUrl) {
                  return {
                    data: {
                      ...user,
                      image: publicUrl,
                    },
                  };
                }
              } catch (err) {
                console.error("[auth databaseHook] avatar upload failed on create:", err);
              }
            }
          },
          after: async (user) => {
            try {
              await emails.sendWelcomeEmail(user.email, {
                first_name: user.name,
              });
            } catch (err) {
              console.error("[auth] Failed to send user welcome email:", err);
            }
          },
        },
        update: {
          before: async (user, context) => {
            if (user.image && typeof user.image === "string") {
              try {
                const userId = (user as any).id ?? context?.context?.session?.user?.id ?? "unknown";

                let publicUrl: string | undefined;
                if (avatars.isBase64Image(user.image)) {
                  publicUrl = await avatars.uploadBase64Avatar(userId, user.image);
                } else if (avatars.isExternalImageUrl(user.image)) {
                  publicUrl = await avatars.uploadUrlAvatar(userId, user.image);
                }

                if (publicUrl) {
                  return {
                    data: {
                      ...user,
                      image: publicUrl,
                    },
                  };
                }
              } catch (err) {
                console.error("[auth databaseHook] avatar upload failed on update:", err);
              }
            }
          },
        },
        delete: {
          after: async (user) => {
            try {
              await emails.sendAccountDeletedEmail(user.email, {
                first_name: user.name,
              });
            } catch (err) {
              console.error("[auth] Failed to send account deleted email:", err);
            }
          },
        },
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url, token }, request) => {
        try {
          const resetUrl = `${appUrl}/verify-email/?token=${token}`;
          await emails.sendVerificationEmail(user.email, {
            name: user.name,
            url: resetUrl,
            expireMinutes: 60,
          });
        } catch (err) {
          console.error("[auth] Failed to send verification email:", err);
        }
      },
    },
    plugins: [
      i18n({
        translations: {
          ...locales,
          en: { ...locales.en, ...pluginLocaleOverrides.en },
          es: { ...locales.es, ...pluginLocaleOverrides.es },
          pt: { ...locales.pt, ...pluginLocaleOverrides.pt },
          "en-US": { ...locales.en, ...pluginLocaleOverrides.en },
          "es-ES": { ...locales.es, ...pluginLocaleOverrides.es },
          "pt-BR": { ...locales.pt, ...pluginLocaleOverrides.pt },
          "pt-PT": { ...locales.pt, ...pluginLocaleOverrides.pt },
        },
        defaultLocale: "pt",
        detection: ["cookie", "header"],
        localeCookie: "locale",
      }),
      dash(),
      admin(),
      inbox(),
      bearer(),
      jwt(),
      mcp({
        // Absolute Studio URLs — relative paths would redirect to the API host.
        loginPage: `${appUrl}/login`,
        consentPage: `${appUrl}/oauth/consent`,
        resource: config.mcpResourceUrl,
        // Prisma String[] cannot store null allowedScopes — declare explicitly.
        scopes: ["openid", "profile", "email", "offline_access"],
        // Primary + extras (e.g. prod auth issuing for both api + dev-api MCP).
        // CIMD clients only auto-link to clientRegistrationDefaultResources;
        // mcp() appends `resource`, so list extras here too.
        resources: [
          {
            identifier: config.mcpResourceUrl,
            name: "Hosanna MCP",
            allowedScopes: ["openid", "profile", "email", "offline_access"],
          },
          ...(config.mcpExtraResourceUrls ?? [])
            .filter((url) => url && url !== config.mcpResourceUrl)
            .map((identifier) => ({
              identifier,
              name: "Hosanna MCP",
              allowedScopes: ["openid", "profile", "email", "offline_access"],
            })),
        ],
        clientRegistrationDefaultResources: [
          config.mcpResourceUrl,
          ...(config.mcpExtraResourceUrls ?? []).filter(
            (url) => url && url !== config.mcpResourceUrl,
          ),
        ],
        // Keep DCR for ChatGPT / older clients; Claude prefers CIMD (below).
        allowDynamicClientRegistration: true,
        allowUnauthenticatedClientRegistration: true,
        clientRegistrationDefaultApplicationType: "infer",
      }),
      // Claude "published client identity" — client_id is an HTTPS metadata URL
      // (e.g. https://claude.ai/oauth/mcp-oauth-client-metadata). Advertises
      // client_id_metadata_document_supported; AS already includes auth method "none".
      cimd({
        fetchClientMetadataResource,
        metadataProfile: "mcp-2026-07-28",
      }),
      haveIBeenPwned(),
      sentinel({
        apiKey: config.betterAuthApiKey,
        security: {
          credentialStuffing: {
            enabled: true,
            thresholds: {
              challenge: 3,
              block: 5,
            },
            windowSeconds: 3600,
            cooldownSeconds: 900,
          },
          freeTrialAbuse: {
            enabled: true,
            thresholds: {
              challenge: 2,
              block: 3,
            },
            maxAccountsPerVisitor: 3,
            action: "block",
          },
          suspiciousIpBlocking: {
            action: "block",
          },
          emailValidation: {
            enabled: true,
            strictness: "medium", // "low", "medium", or "high"
            action: "block",
          },
          emailNormalization: {
            enabled: true,
          },
        },
      }),
      captcha({
        provider: "cloudflare-turnstile",
        secretKey: config.turnstileSecretKey,
      }),
      twoFactor({
        issuer: "Hosanna",

        otpOptions: {
          storeOTP: "hashed",
          sendOTP: async ({ user, otp }) => {
            try {
              await emails.sendOtpEmail(user.email, {
                name: user.name,
                otp,
                expireMinutes: 10,
              });
            } catch (err) {
              console.error("[auth] Failed to send 2FA OTP email:", err);
            }
          },
        },
      }),
      organization({
        organizationLimit: 1,
        membershipLimit: 500,
        teams: {
          enabled: true,
          maximumTeams: 50,
        },
        roles,
        sendInvitationEmail: async (data) => {
          try {
            const locale = await getOrgLocale(data.organization.id);
            const inviteUrl = `${appUrl}/accept-invitation/?id=${data.id}`;
            await emails.sendChurchInvitationEmail(data.email, {
              church_name: data.organization.name,
              inviter_name: data.inviter?.user?.name || "A church leader",
              invite_link: inviteUrl,
              locale,
            });
          } catch (err) {
            console.error("[auth] Failed to send church invitation email:", err);
          }
        },
        organizationHooks: {
          beforeCreateOrganization: async ({ organization, user }) => {
            // Reserved for Studio isolated demo mode (`DEMO_ORG_SLUG`).
            const reservedSlugs = new Set(["hosanna-demo", "demo"]);
            const slug = (organization?.slug ?? "").toLowerCase();
            if (reservedSlugs.has(slug)) {
              throw new Error("This organization slug is reserved. Please choose another.");
            }
            const locale = (organization?.metadata?.["locale"] as string) || "pt-PT";
            return {
              data: {
                ...organization,
                metadata: {
                  description: (organization?.metadata?.["description"] as string) || "",
                  shortName:
                    (organization?.metadata?.["shortName"] as string) ||
                    organization.name
                      ?.split(/\s+/)
                      .map((word) => word[0])
                      .join("") ||
                    "",
                  settings: {
                    general: {
                      locale,
                      timezone: (organization?.metadata?.["timezone"] as string) || "Europe/Lisbon",
                      weekStartsOn: 1,
                    },
                    services: {
                      defaultDurations: {
                        sermon: 2300,
                        song: 210,
                      },
                      usualStartTime: "10:00",
                      showNotes: true,
                      showServiceDuration: true,
                      autoSave: true,
                    },
                    appearance: {
                      accentColor: "#44e0ff",
                      showBranding: true,
                    },
                    agenda: {
                      responsibilityCategories:
                        RESPONSIBILITIES[locale as keyof typeof RESPONSIBILITIES] ??
                        RESPONSIBILITIES["pt-PT"],
                    },
                  },
                },
              },
            };
          },

          afterAddMember: async ({ member, user, organization }) => {
            try {
              const locale = await getOrgLocale(organization.id);
              await emails.sendWelcomeEmail(user.email, {
                first_name: user.name,
                organizationName: organization.name,
                dashboardUrl: studioUrl,
                locale,
              });
            } catch (err) {
              console.error("[auth] Failed to send welcome email:", err);
            }

            notifyOrg({
              organizationId: organization.id,
              roles: ["admin", "owner"],
              type: "org.new_member",
              title: t(defaultLocale, "notification.new_member_title"),
              description: t(defaultLocale, "notification.new_member_description", {
                name: user.name,
              }),
            });
          },

          afterUpdateMemberRole: async ({ member, previousRole, user, organization }) => {
            try {
              const locale = await getOrgLocale(organization.id);
              if (member.role === "admin" || member.role === "owner") {
                await emails.sendPromotedToAdminEmail(user.email, {
                  first_name: user.name,
                  church_name: organization.name,
                  workspace_settings_url: `${studioUrl}/${organization.slug}/settings`,
                  locale,
                });
              } else {
                await emails.sendRoleChangedEmail(user.email, {
                  first_name: user.name,
                  church_name: organization.name,
                  new_role: member.role,
                  locale,
                });
              }
            } catch (err) {
              console.error("[auth] Failed to send member role updated email:", err);
            }
          },

          afterRemoveMember: async ({ member, user, organization }) => {
            try {
              const locale = await getOrgLocale(organization.id);
              await emails.sendRemovedFromChurchEmail(user.email, {
                first_name: user.name,
                church_name: organization.name,
                locale,
              });
            } catch (err) {
              console.error("[auth] Failed to send removed from church email:", err);
            }
          },
        },
      }),
      stripe({
        stripeClient,
        stripeWebhookSecret: config.stripeWebhookSecret,
        createCustomerOnSignUp: false,
        subscription: {
          enabled: true,
          plans: [
            {
              name: "cloud",
              priceId: "price_1U8VA3RpLrnXO63sBlJexS4p",
              annualDiscountPriceId: "price_1UB1xcRpLrnXO63soQj5HG4Y",
              freeTrial: {
                days: 14,
                onTrialStart: async (subscription) => {
                  try {
                    const { churchName, recipients, locale } = await getOrgRecipientsWithLocale(
                      subscription.referenceId,
                      ["owner"],
                    );
                    await Promise.all(
                      recipients.map((r) =>
                        emails.sendTrialStartedEmail(r.email, {
                          first_name: r.name,
                          church_name: churchName,
                          plan: subscription.plan,
                          locale,
                        }),
                      ),
                    );
                  } catch (err) {
                    console.error("[auth] Failed to send trial started email:", err);
                  }
                  notifyOrg({
                    organizationId: subscription.referenceId,
                    roles: ["owner"],
                    type: "billing.trial_started",
                    title: t(defaultLocale, "notification.trial_started_title"),
                    description: t(defaultLocale, "notification.trial_started_description"),
                  });
                },
                onTrialEnd: async ({ subscription }) => {
                  try {
                    const { churchName, recipients, locale } = await getOrgRecipientsWithLocale(
                      subscription.referenceId,
                      ["owner"],
                    );
                    await Promise.all(
                      recipients.map((r) =>
                        emails.sendTrialEndedEmail(r.email, {
                          first_name: r.name,
                          church_name: churchName,
                          plan: subscription.plan,
                          locale,
                        }),
                      ),
                    );
                  } catch (err) {
                    console.error("[auth] Failed to send trial ended email:", err);
                  }
                  notifyOrg({
                    organizationId: subscription.referenceId,
                    roles: ["owner"],
                    type: "billing.trial_ended",
                    title: t(defaultLocale, "notification.trial_ended_title"),
                    description: t(defaultLocale, "notification.trial_ended_description"),
                  });
                },
                onTrialExpired: async (subscription) => {
                  try {
                    const { churchName, recipients, locale } = await getOrgRecipientsWithLocale(
                      subscription.referenceId,
                      ["owner"],
                    );
                    await Promise.all(
                      recipients.map((r) =>
                        emails.sendTrialExpiredEmail(r.email, {
                          first_name: r.name,
                          church_name: churchName,
                          plan: subscription.plan,
                          locale,
                        }),
                      ),
                    );
                  } catch (err) {
                    console.error("[auth] Failed to send trial expired email:", err);
                  }
                  notifyOrg({
                    organizationId: subscription.referenceId,
                    roles: ["owner"],
                    type: "billing.trial_expired",
                    title: t(defaultLocale, "notification.trial_expired_title"),
                    description: t(defaultLocale, "notification.trial_expired_description"),
                  });
                },
              },
            },
          ],
          getCheckoutSessionParams: async () => ({
            params: {
              allow_promotion_codes: true,
              consent_collection: {
                terms_of_service: "required",
              },
              mode: "subscription",
            },
          }),
          authorizeReference: async ({ user, referenceId, action }) => {
            if (action === "list-subscription") {
              return isOrgMember(user.id, referenceId);
            }
            return isOrgOwner(user.id, referenceId);
          },
          onSubscriptionComplete: async ({ subscription, plan }) => {
            try {
              const { churchName, recipients, locale } = await getOrgRecipientsWithLocale(
                subscription.referenceId,
                ["owner", "admin"],
              );
              await Promise.all(
                recipients.map((r) =>
                  emails.sendSubscribedEmail(r.email, {
                    first_name: r.name,
                    church_name: churchName,
                    plan: plan.name,
                    locale,
                  }),
                ),
              );
              notifyOrg({
                organizationId: subscription.referenceId,
                roles: ["owner", "admin"],
                type: "billing.subscribed",
                title: t(defaultLocale, "notification.subscribed_title"),
                description: t(defaultLocale, "notification.subscribed_description", {
                  plan: plan.name,
                }),
              });
            } catch (err) {
              console.error("[auth] Failed to notify org after subscription complete:", err);
            }
          },
          onSubscriptionCancel: async ({ subscription, event }) => {
            try {
              const { churchName, recipients, locale } = await getOrgRecipientsWithLocale(
                subscription.referenceId,
                ["owner", "admin"],
              );
              await Promise.all(
                recipients.map((r) =>
                  emails.sendCanceledEmail(r.email, {
                    first_name: r.name,
                    church_name: churchName,
                    plan: subscription.plan,
                    locale,
                  }),
                ),
              );
              notifyOrg({
                organizationId: subscription.referenceId,
                roles: ["owner", "admin"],
                type: "billing.canceled",
                title: t(defaultLocale, "notification.canceled_title"),
                description: t(defaultLocale, "notification.canceled_description"),
              });
            } catch (err) {
              console.error("[auth] Failed to notify org after subscription cancel:", err);
            }
          },
        },
        organization: {
          enabled: true,
        },
      }),
    ],
    ...shared,
    user: {
      changeEmail: {
        enabled: true,
        sendChangeEmailConfirmation: async (
          {
            user,
            newEmail,
            url,
            token,
          }: { user: any; newEmail: string; url: string; token: string },
          request?: any,
        ) => {
          try {
            await emails.sendChangeEmailVerificationEmail(newEmail, {
              first_name: user.name,
              new_email: newEmail,
              confirm_email_link: url,
            });
          } catch (err) {
            console.error("[auth] Failed to send change email confirmation:", err);
          }
        },
      },
      additionalFields: {
        metadata: {
          type: "string",
          required: false,
        },
      },
    },
    // Link Google to an existing user with the same verified email (covers
    // orphan users left when account.create failed on required `issuer`).
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ["google"],
        // Local email may be unverified after a partial sign-up failure.
        requireLocalEmailVerified: false,
      },
    },
    socialProviders: {
      google: {
        clientId: config.googleClientId,
        clientSecret: config.googleClientSecret,
        mapProfileToUser: (profile) => {
          return {
            email: profile.email,
            name: profile.name || profile.email.split("@")[0],
            image: profile.picture,
          };
        },
      },
    },
  });
}

/**
 * Shared Better Auth factory.
 *
 * - `mode: "full"` (default) — auth app HTTP handler (mail, Stripe, Google, MCP, …)
 * - `mode: "slim"` — API resource server (getSession + inbox notify + JWKS)
 */
// Explicit `any` — Better Auth's inferred instance type is too large / non-portable for declaration emit.
export function createAuth(options: CreateAuthOptions): any {
  if (options.mode === "slim") {
    return createSlimAuth(options);
  }
  return createFullAuth(options);
}

export type HosannaAuth = any;
