// SPDX-License-Identifier: AGPL-3.0-only
import { getAuthComponentSchemas } from "./schemas";

const sessionAuth = [{ cookieAuth: [] }, { bearerAuth: [] }];
const cronAuth = [{ cronSecret: [] }];

export function getAuthPaths(): Record<string, any> {
  return {
    "/billing/pricing": {
      get: {
        tags: ["Billing"],
        summary: "Public plan display prices",
        operationId: "getBillingPricing",
        security: [],
        description: "Returns public localized subscription pricing tiers from Global Config.",
        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PlanPricing" },
              },
            },
          },
        },
      },
    },
    "/billing/entitlement": {
      get: {
        tags: ["Billing"],
        summary: "Org subscription entitlement",
        operationId: "getBillingEntitlement",
        security: sessionAuth,
        description:
          "Check active subscription entitlements and feature gates for the authenticated organization.",
        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { entitled: { type: "boolean" } },
                },
              },
            },
          },
        },
      },
    },
    "/cron/agenda-reminders": {
      get: {
        tags: ["Cron"],
        summary: "Cron: agenda-reminders",
        operationId: "getCronAgendaReminders",
        security: cronAuth,
        description:
          "Dispatch morning notifications for musicians with upcoming scheduled services.",
        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: { type: "object", additionalProperties: true },
              },
            },
          },
        },
      },
      post: {
        tags: ["Cron"],
        summary: "Cron: agenda-reminders",
        operationId: "postCronAgendaReminders",
        security: cronAuth,
        description:
          "Dispatch morning notifications for musicians with upcoming scheduled services.",
        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: { type: "object", additionalProperties: true },
              },
            },
          },
        },
      },
    },
    "/backup": {
      get: {
        tags: ["Backup"],
        summary: "Export backup",
        operationId: "exportBackup",
        security: sessionAuth,
        description:
          "Export organization content, settings, members, invitations, and non-private service notes as JSON. Available in read-only billing mode.",
        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BackupDocument" },
              },
            },
          },
        },
      },
    },
    "/backup/restore": {
      post: {
        tags: ["Backup"],
        summary: "Restore backup",
        operationId: "restoreBackup",
        security: sessionAuth,
        description: "Restore organization library from an uploaded backup JSON file.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/BackupDocument" },
            },
          },
        },
        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    counts: {
                      type: "object",
                      properties: {
                        folders: { type: "integer" },
                        songs: { type: "integer" },
                        services: { type: "integer" },
                        collections: { type: "integer" },
                        agendaEvents: { type: "integer" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/notifications": {
      post: {
        tags: ["Notifications"],
        summary: "Send notification (hosted on auth.hosanna.live)",
        operationId: "sendNotification",
        security: sessionAuth,
        description:
          "Unified multi-channel dispatch (inbox, push, email) with user/org/team targeting.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["type", "title"],
                properties: {
                  userId: { type: "string" },
                  organizationId: { type: "string" },
                  teamId: { type: "string" },
                  roles: { type: "array", items: { type: "string" } },
                  type: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  body: { type: "string" },
                  href: { type: "string" },
                  channel: {
                    type: "string",
                    enum: ["inbox", "push", "both"],
                    default: "inbox",
                  },
                  channels: {
                    type: "array",
                    items: {
                      type: "string",
                      enum: ["inbox", "push", "email"],
                    },
                  },
                  fcm: { type: "object", additionalProperties: true },
                  push: { type: "object", additionalProperties: true },
                  email: { type: "object", additionalProperties: true },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "OK",
            content: {
              "application/json": {
                schema: { type: "object", additionalProperties: true },
              },
            },
          },
        },
      },
    },
    "/erasure/otp": {
      post: {
        tags: ["Erasure"],
        summary: "Send deletion verification OTP",
        operationId: "sendErasureOtp",
        security: sessionAuth,
        description:
          "Send a dedicated 6-digit email OTP to re-authenticate before account or organization deletion.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["kind"],
                properties: {
                  kind: { type: "string", enum: ["account", "organization"] },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "OTP sent",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { sent: { type: "boolean" } },
                },
              },
            },
          },
        },
      },
    },
    "/erasure/account": {
      get: {
        tags: ["Erasure"],
        summary: "Check account deletion eligibility",
        operationId: "checkAccountErasure",
        security: sessionAuth,
        description:
          "Returns any organizations where the authenticated user is the sole owner.",
        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    soleOwnerOrgs: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          name: { type: "string" },
                          slug: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Erasure"],
        summary: "Delete authenticated user account (GDPR Art. 17)",
        operationId: "eraseAccount",
        security: sessionAuth,
        description:
          "Permanently deletes the user account after OTP re-authentication. Blocked if the user is the sole owner of any organization.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["otp"],
                properties: {
                  otp: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Account deleted",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { deleted: { type: "boolean" } },
                },
              },
            },
          },
          409: {
            description: "Blocked because user is sole owner of one or more organizations",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    blocked: { type: "boolean" },
                    reason: { type: "string" },
                    orgs: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          name: { type: "string" },
                          slug: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/erasure/organization": {
      post: {
        tags: ["Erasure"],
        summary: "Delete active organization (GDPR Art. 17)",
        operationId: "eraseOrganization",
        security: sessionAuth,
        description:
          "Permanently deletes the active organization, cancels its Stripe subscription immediately, removes its logo, and retains detached DPA records.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["otp", "exportConfirmed"],
                properties: {
                  otp: { type: "string" },
                  exportConfirmed: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Organization deleted",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    deleted: { type: "boolean" },
                    stripeNote: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
  };
}

export function buildAuthOpenApiDoc() {
  return {
    openapi: "3.1.0",
    info: {
      title: "Hosanna Auth & Services API",
      version: "2.22.2",
      description:
        "Identity-adjacent endpoints hosted on auth.hosanna.live (notifications, billing, backup, agenda reminders).",
      license: { name: "Apache-2.0" },
    },
    servers: [
      { url: "https://auth.hosanna.live/api", description: "Auth host" },
      { url: "http://localhost:5174/api", description: "Local auth dev" },
    ],
    tags: [
      { name: "Notifications" },
      { name: "Billing" },
      { name: "Backup" },
      { name: "Cron" },
      { name: "Erasure" },
    ],
    paths: getAuthPaths(),
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "hosanna.session_token",
        },
        bearerAuth: {
          type: "http",
          scheme: "bearer",
        },
        cronSecret: {
          type: "http",
          scheme: "bearer",
        },
      },
      schemas: getAuthComponentSchemas(),
    },
  };
}

export { getAuthComponentSchemas };
