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
          "Export entire organization library (songs, folders, services) as a standalone JSON backup archive.",
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
    tags: [{ name: "Notifications" }, { name: "Billing" }, { name: "Backup" }, { name: "Cron" }],
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
