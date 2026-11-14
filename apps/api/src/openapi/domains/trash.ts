import { idParamSchema } from "../../validators/common.validators.js";
import { jsonResp, op, OpenApiOperation, sessionAuth, zodToPathParams } from "../builder.js";

export function getTrashPaths(): Record<string, Record<string, OpenApiOperation>> {
  const idParam = zodToPathParams(idParamSchema);

  return {
    "/trash": {
      get: op("List trash", {
        tags: ["Trash"],
        operationId: "listTrash",
        security: sessionAuth,
        description: "List soft-deleted songs, folders, and services pending purge.",
        responses: jsonResp(200, {
          type: "object",
          properties: {
            songs: { type: "array", items: { $ref: "#/components/schemas/Song" } },
            folders: { type: "array", items: { $ref: "#/components/schemas/Folder" } },
            services: { type: "array", items: { $ref: "#/components/schemas/Service" } },
          },
        }),
      }),
    },
    "/trash/songs/{id}/restore": {
      post: op("Restore trashed song", {
        tags: ["Trash"],
        operationId: "restoreTrashSong",
        security: sessionAuth,
        description: "Restore a soft-deleted song back to the active library.",
        parameters: idParam,
        responses: jsonResp(200, { type: "object", additionalProperties: true }),
      }),
    },
    "/trash/folders/{id}/restore": {
      post: op("Restore trashed folder", {
        tags: ["Trash"],
        operationId: "restoreTrashFolder",
        security: sessionAuth,
        description: "Restore a soft-deleted folder back to the active folder tree.",
        parameters: idParam,
        responses: jsonResp(200, { type: "object", additionalProperties: true }),
      }),
    },
    "/trash/services/{id}/restore": {
      post: op("Restore trashed service", {
        tags: ["Trash"],
        operationId: "restoreTrashService",
        security: sessionAuth,
        description: "Restore a soft-deleted service back to scheduled services.",
        parameters: idParam,
        responses: jsonResp(200, { type: "object", additionalProperties: true }),
      }),
    },
  };
}
