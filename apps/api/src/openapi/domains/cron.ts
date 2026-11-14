import { op, jsonResp, cronAuth, OpenApiOperation } from "../builder.js";

export function getCronPaths(): Record<string, Record<string, OpenApiOperation>> {
  return {
    "/cron/purge-trash": {
      get: op("Cron: purge-trash", {
        tags: ["Cron"],
        operationId: "getCronPurgeTrash",
        security: cronAuth,
        description: "Trigger background job to purge soft-deleted items whose purgeAt date has expired.",
        responses: jsonResp(200, {
          type: "object",
          properties: {
            purged: { type: "integer", description: "Count of purged items" },
          },
        }),
      }),
      post: op("Cron: purge-trash", {
        tags: ["Cron"],
        operationId: "postCronPurgeTrash",
        security: cronAuth,
        description: "Trigger background job to purge soft-deleted items whose purgeAt date has expired.",
        responses: jsonResp(200, {
          type: "object",
          properties: {
            purged: { type: "integer", description: "Count of purged items" },
          },
        }),
      }),
    },
  };
}
