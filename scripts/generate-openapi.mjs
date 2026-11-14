import fs from "node:fs";
import { stringify } from "yaml";
import { buildApiOpenApiDoc } from "../apps/api/src/openapi/index.js";
import { buildAuthOpenApiDoc } from "../apps/auth/lib/openapi/index.js";

const apiDoc = buildApiOpenApiDoc();
const authDoc = buildAuthOpenApiDoc();

const doc = {
  openapi: "3.1.0",
  info: {
    title: "Hosanna API",
    version: "2.22.2",
    description:
      "Production REST API for Hosanna Studio and the Flutter musician app.\n" +
      "Authentication is Better Auth (session cookie or Bearer). `/api/auth/*` is owned by Better Auth\n" +
      "and is not expanded here. MCP lives at `/mcp` (outside this document).\n\n" +
      "Identity-adjacent routes moved to auth.hosanna.live: `/api/notifications*`, `/api/billing/*`,\n" +
      "`/api/backup*`, `/api/cron/agenda-reminders`. This API keeps domain music routes and\n" +
      "`/api/cron/purge-trash`.",
    license: { name: "Apache-2.0" },
  },
  servers: [
    { url: "https://api.hosanna.live/api", description: "Production API (domain data)" },
    {
      url: "https://auth.hosanna.live/api",
      description: "Auth host (notifications, billing probes, backup, agenda cron)",
    },
    { url: "http://localhost:3000/api", description: "Local API" },
  ],
  tags: [
    { name: "Health" },
    { name: "Billing" },
    { name: "Cron" },
    { name: "Songs" },
    { name: "Folders" },
    { name: "Services" },
    { name: "ServiceNotes" },
    { name: "Annotations" },
    { name: "Replication" },
    { name: "Trash" },
    { name: "Backup" },
    { name: "AI" },
    { name: "Integrations" },
    { name: "Notifications" },
  ],
  paths: {
    "/health": apiDoc.paths["/health"],
    "/billing/pricing": authDoc.paths["/billing/pricing"],
    "/billing/entitlement": authDoc.paths["/billing/entitlement"],
    "/cron/agenda-reminders": authDoc.paths["/cron/agenda-reminders"],
    "/cron/purge-trash": apiDoc.paths["/cron/purge-trash"],
    "/songs/import/jobs": apiDoc.paths["/songs/import/jobs"],
    "/songs/import/jobs/{id}": apiDoc.paths["/songs/import/jobs/{id}"],
    "/songs": apiDoc.paths["/songs"],
    "/songs/batch": apiDoc.paths["/songs/batch"],
    "/songs/batch-tags": apiDoc.paths["/songs/batch-tags"],
    "/songs/{id}": apiDoc.paths["/songs/{id}"],
    "/songs/{id}/download": apiDoc.paths["/songs/{id}/download"],
    "/songs/{id}/move": apiDoc.paths["/songs/{id}/move"],
    "/folders": apiDoc.paths["/folders"],
    "/folders/flat": apiDoc.paths["/folders/flat"],
    "/folders/{id}": apiDoc.paths["/folders/{id}"],
    "/folders/{id}/move-content-to-root": apiDoc.paths["/folders/{id}/move-content-to-root"],
    "/folders/{id}/with-content": apiDoc.paths["/folders/{id}/with-content"],
    "/services": apiDoc.paths["/services"],
    "/services/{id}": apiDoc.paths["/services/{id}"],
    "/services/{id}/elements": apiDoc.paths["/services/{id}/elements"],
    "/services/{id}/notes": apiDoc.paths["/services/{id}/notes"],
    "/services/{id}/notes/{noteId}": apiDoc.paths["/services/{id}/notes/{noteId}"],
    "/annotation/services/{serviceId}/songs/{songId}/annotation":
      apiDoc.paths["/annotation/services/{serviceId}/songs/{songId}/annotation"],
    "/replication/{collection}/pull": apiDoc.paths["/replication/{collection}/pull"],
    "/replication/pull": apiDoc.paths["/replication/pull"],
    "/replication/{collection}/push": apiDoc.paths["/replication/{collection}/push"],
    "/trash": apiDoc.paths["/trash"],
    "/trash/songs/{id}/restore": apiDoc.paths["/trash/songs/{id}/restore"],
    "/trash/folders/{id}/restore": apiDoc.paths["/trash/folders/{id}/restore"],
    "/trash/services/{id}/restore": apiDoc.paths["/trash/services/{id}/restore"],
    "/backup": authDoc.paths["/backup"],
    "/backup/restore": authDoc.paths["/backup/restore"],
    "/ai/settings": apiDoc.paths["/ai/settings"],
    "/ai/settings/key": apiDoc.paths["/ai/settings/key"],
    "/ai/billing": apiDoc.paths["/ai/billing"],
    "/ai/memory": apiDoc.paths["/ai/memory"],
    "/ai/memory/{id}": apiDoc.paths["/ai/memory/{id}"],
    "/ai/memory/personal": apiDoc.paths["/ai/memory/personal"],
    "/ai/memory/personal/{id}": apiDoc.paths["/ai/memory/personal/{id}"],
    "/ai/confirm": apiDoc.paths["/ai/confirm"],
    "/ai/chat": apiDoc.paths["/ai/chat"],
    "/youtube/duration": apiDoc.paths["/youtube/duration"],
    "/cifra": apiDoc.paths["/cifra"],
    "/notifications": authDoc.paths["/notifications"],
  },
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "hosanna.session_token",
        description:
          "Better Auth session cookie forwarded to the auth app for validation (cookie name may vary by Better Auth version/prefix).",
      },
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        description:
          "Better Auth session token (Authorization: Bearer), validated via the auth app.",
      },
      cronSecret: {
        type: "http",
        scheme: "bearer",
        description: "CRON_SECRET for /api/cron/*",
      },
    },
    schemas: {
      Error: apiDoc.components.schemas.Error,
      Checkpoint: apiDoc.components.schemas.Checkpoint,
      Song: apiDoc.components.schemas.Song,
      Folder: apiDoc.components.schemas.Folder,
      ServiceElement: apiDoc.components.schemas.ServiceElement,
      Service: apiDoc.components.schemas.Service,
      ServiceNote: apiDoc.components.schemas.ServiceNote,
      Collection: apiDoc.components.schemas.Collection,
      AgendaEvent: apiDoc.components.schemas.AgendaEvent,
      PlanPricing: authDoc.components.schemas.PlanPricing,
      BackupDocument: authDoc.components.schemas.BackupDocument,
      ReplicationCollection: apiDoc.components.schemas.ReplicationCollection,
      PullRequest: apiDoc.components.schemas.PullRequest,
      PullResponse: apiDoc.components.schemas.PullResponse,
      ChangeRow: apiDoc.components.schemas.ChangeRow,
      AnnotationGetResponse: apiDoc.components.schemas.AnnotationGetResponse,
      SongImportJob: apiDoc.components.schemas.SongImportJob,
    },
  },
};

const specPath = new URL("../packages/types/openapi.yaml", import.meta.url);
fs.writeFileSync(specPath, stringify(doc, { lineWidth: 0 }));
console.log("Wrote packages/types/openapi.yaml paths=", Object.keys(doc.paths).length);
