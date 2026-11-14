import { idParamSchema } from "../../validators/common.validators.js";
import {
  batchCreateSongsSchema,
  batchTagsSchema,
  createSongSchema,
  listSongsQuerySchema,
  moveSongSchema,
  updateSongSchema,
} from "../../validators/song.validators.js";
import {
  jsonBody,
  jsonResp,
  op,
  OpenApiOperation,
  sessionAuth,
  zodToPathParams,
  zodToQueryParams,
} from "../builder.js";

export function getSongPaths(): Record<string, Record<string, OpenApiOperation>> {
  const idParam = zodToPathParams(idParamSchema);

  return {
    "/songs": {
      get: op("List songs", {
        tags: ["Songs"],
        operationId: "listSongs",
        security: sessionAuth,
        description:
          "Paginated song library query with optional text search, tag filtering, folder scoping, and sort order.",
        parameters: zodToQueryParams(listSongsQuerySchema),
        responses: jsonResp(200, {
          type: "object",
          properties: {
            songs: { type: "array", items: { $ref: "#/components/schemas/Song" } },
            total: { type: "integer" },
            page: { type: "integer" },
            limit: { type: "integer" },
            totalPages: { type: "integer" },
          },
        }),
      }),
      post: op("Create song", {
        tags: ["Songs"],
        operationId: "createSong",
        security: sessionAuth,
        description: "Create a new song document with ChordPro content and folder assignment.",
        requestBody: jsonBody(createSongSchema),
        responses: {
          ...jsonResp(201, { $ref: "#/components/schemas/Song" }),
          401: { description: "Unauthorized" },
        },
      }),
    },
    "/songs/batch": {
      post: op("Create songs batch", {
        tags: ["Songs"],
        operationId: "createSongsBatch",
        security: sessionAuth,
        description: "Batch import or insert multiple song records in a single transactional request.",
        requestBody: jsonBody({
          type: "object",
          required: ["songs"],
          properties: {
            songs: {
              type: "array",
              minItems: 1,
              items: { type: "object", additionalProperties: true },
            },
          },
        }),
        responses: jsonResp(201, {
          type: "array",
          items: { $ref: "#/components/schemas/Song" },
        }),
      }),
    },
    "/songs/batch-tags": {
      put: op("Batch update song tags", {
        tags: ["Songs"],
        operationId: "batchUpdateSongTags",
        security: sessionAuth,
        description: "Apply tag modifications (append, replace, or remove) across multiple song IDs.",
        requestBody: jsonBody(batchTagsSchema),
        responses: jsonResp(200, {
          type: "object",
          properties: { success: { type: "boolean" }, count: { type: "integer" } },
        }),
      }),
    },
    "/songs/{id}": {
      get: op("Get song", {
        tags: ["Songs"],
        operationId: "getSong",
        security: sessionAuth,
        description: "Retrieve a single song by its UUID.",
        parameters: idParam,
        responses: jsonResp(200, { $ref: "#/components/schemas/Song" }),
      }),
      put: op("Update song", {
        tags: ["Songs"],
        operationId: "updateSong",
        security: sessionAuth,
        description:
          "Update song metadata, title, or ChordPro content. Enforces optimistic concurrency via updatedAt.",
        parameters: idParam,
        requestBody: jsonBody(updateSongSchema),
        responses: {
          ...jsonResp(200, { $ref: "#/components/schemas/Song" }),
          409: { description: "Conflict - song was modified concurrently" },
        },
      }),
      delete: op("Delete song", {
        tags: ["Songs"],
        operationId: "deleteSong",
        security: sessionAuth,
        description: "Soft-delete a song into trash.",
        parameters: idParam,
        responses: { 204: { description: "Deleted" } },
      }),
    },
    "/songs/{id}/download": {
      get: op("Download song ChordPro", {
        tags: ["Songs"],
        operationId: "downloadSong",
        security: sessionAuth,
        description: "Download raw ChordPro text representation as a file attachment.",
        parameters: idParam,
        responses: {
          200: {
            description: "ChordPro file",
            content: { "text/vnd.chordpro": { schema: { type: "string" } } },
          },
        },
      }),
    },
    "/songs/{id}/move": {
      put: op("Move song", {
        tags: ["Songs"],
        operationId: "moveSong",
        security: sessionAuth,
        description: "Move song into another folder or to library root (null folderId).",
        parameters: idParam,
        requestBody: jsonBody(moveSongSchema),
        responses: jsonResp(200, { $ref: "#/components/schemas/Song" }),
      }),
    },
  };
}
