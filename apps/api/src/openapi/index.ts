import { getApiComponentSchemas } from "./schemas.js";
import { getCronPaths } from "./domains/cron.js";
import { getFolderPaths } from "./domains/folders.js";
import { getHealthPaths } from "./domains/health.js";
import { getMediaPaths } from "./domains/media.js";
import { getReplicationPaths } from "./domains/replication.js";
import { getServicePaths } from "./domains/services.js";
import { getSongPaths } from "./domains/songs.js";
import { getTrashPaths } from "./domains/trash.js";
import { getAiPaths } from "./domains/ai.js";

export function getApiPaths(): Record<string, any> {
  return {
    ...getHealthPaths(),
    ...getCronPaths(),
    ...getSongPaths(),
    ...getFolderPaths(),
    ...getServicePaths(),
    ...getMediaPaths(),
    ...getReplicationPaths(),
    ...getTrashPaths(),
    ...getAiPaths(),
  };
}

export function buildApiOpenApiDoc() {
  const paths = getApiPaths();
  const schemas = getApiComponentSchemas();

  return {
    openapi: "3.1.0",
    info: {
      title: "Hosanna API",
      version: "2.22.2",
      description:
        "Production REST API for Hosanna Studio and the Flutter musician app.\n" +
        "Authentication is Better Auth (session cookie or Bearer). `/api/auth/*` is owned by Better Auth\n" +
        "and is not expanded here. MCP lives at `/mcp` (outside this document).\n\n" +
        "Domain music routes and replication services hosted on api.hosanna.live.",
      license: { name: "Apache-2.0" },
    },
    servers: [
      { url: "https://api.hosanna.live/api", description: "Production API (domain data)" },
      { url: "http://localhost:3000/api", description: "Local API" },
    ],
    tags: [
      { name: "Health" },
      { name: "Cron" },
      { name: "Songs" },
      { name: "Folders" },
      { name: "Services" },
      { name: "ServiceNotes" },
      { name: "Annotations" },
      { name: "Replication" },
      { name: "Trash" },
      { name: "AI" },
      { name: "Integrations" },
    ],
    paths,
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "hosanna.session_token",
          description:
            "Better Auth session cookie forwarded to the auth app for validation.",
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
      schemas,
    },
  };
}

export { getApiComponentSchemas };
