import { createSongImportJobSchema } from "../../validators/songImport.validators.js";
import { jsonBody, jsonResp, op, OpenApiOperation, sessionAuth } from "../builder.js";

export function getMediaPaths(): Record<string, Record<string, OpenApiOperation>> {
  return {
    "/songs/import/jobs": {
      post: op("Start a Logos AI song-import job (photo/gallery/PDF)", {
        tags: ["Songs"],
        operationId: "createSongImportJob",
        security: sessionAuth,
        description:
          "Accepts a sheet-music image (and optional extra page screenshots for PDFs). Returns 202 with a job id immediately; poll GET /songs/import/jobs/{id} for real step progress. Cancel with DELETE. Does not persist a song — the client reviews the draft then creates locally.",
        requestBody: jsonBody(createSongImportJobSchema),
        responses: {
          202: {
            description: "Job created and queued",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["id", "status"],
                  properties: {
                    id: { type: "string", format: "uuid" },
                    status: { type: "string", enum: ["queued"] },
                  },
                },
              },
            },
          },
        },
      }),
    },
    "/songs/import/jobs/{id}": {
      get: op("Poll a Logos AI song-import job", {
        tags: ["Songs"],
        operationId: "getSongImportJob",
        security: sessionAuth,
        description: "Poll import job status, progress steps, and extracted ChordPro content.",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: jsonResp(200, { $ref: "#/components/schemas/SongImportJob" }),
      }),
      delete: op("Cancel a running Logos AI song-import job", {
        tags: ["Songs"],
        operationId: "cancelSongImportJob",
        security: sessionAuth,
        description: "Cancel an active song import pipeline job.",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: jsonResp(
          200,
          { $ref: "#/components/schemas/SongImportJob" },
          "Job cancelled (or already terminal)",
        ),
      }),
    },
    "/annotation/services/{serviceId}/songs/{songId}/annotation": {
      get: op("Get song annotation", {
        tags: ["Annotations"],
        operationId: "getAnnotation",
        security: sessionAuth,
        description:
          "Retrieve sheet music pencil/stroke drawing annotations for a song in a service.",
        parameters: [
          { name: "serviceId", in: "path", required: true, schema: { type: "string" } },
          { name: "songId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          ...jsonResp(200, { $ref: "#/components/schemas/AnnotationGetResponse" }),
          404: { description: "Not found" },
        },
      }),
      put: op("Put song annotation", {
        tags: ["Annotations"],
        operationId: "putAnnotation",
        security: sessionAuth,
        description: "Save updated stroke annotation canvas data.",
        parameters: [
          { name: "serviceId", in: "path", required: true, schema: { type: "string" } },
          { name: "songId", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: jsonBody({
          type: "object",
          required: ["canvasDataBase64"],
          properties: { canvasDataBase64: { type: "string" } },
        }),
        responses: jsonResp(200, {
          type: "object",
          properties: {
            updatedAt: { type: "string", format: "date-time" },
            updatedById: { type: "string", nullable: true },
            revision: { type: "integer" },
          },
        }),
      }),
    },
    "/youtube/duration": {
      get: op("YouTube duration", {
        tags: ["Integrations"],
        operationId: "getYoutubeDuration",
        security: sessionAuth,
        description: "Inspect video title and duration from a YouTube URL or video ID.",
        parameters: [
          { name: "url", in: "query", required: true, schema: { type: "string", minLength: 1 } },
        ],
        responses: jsonResp(200, { type: "object", additionalProperties: true }),
      }),
    },
    "/cifra": {
      get: op("Import from Cifra Club / Ultimate Guitar", {
        tags: ["Integrations"],
        operationId: "importCifra",
        security: sessionAuth,
        description: "Scrape and parse public chord charts from online tablature sites.",
        parameters: [
          { name: "url", in: "query", required: true, schema: { type: "string", format: "uri" } },
        ],
        responses: jsonResp(200, { type: "object", additionalProperties: true }),
      }),
    },
  };
}
