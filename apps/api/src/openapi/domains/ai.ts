import {
  aiChatContextSchema,
  aiConfirmActionSchema,
  updateAiSettingsSchema,
} from "../../validators/ai.validators.js";
import { jsonBody, jsonResp, op, OpenApiOperation, sessionAuth } from "../builder.js";

export function getAiPaths(): Record<string, Record<string, OpenApiOperation>> {
  return {
    "/ai/settings": {
      get: op("Get AI settings", {
        tags: ["AI"],
        operationId: "getAiSettings",
        security: sessionAuth,
        description: "Retrieve active organization AI configuration and enabled capabilities.",
        responses: jsonResp(200, { type: "object", additionalProperties: true }),
      }),
      put: op("Update AI settings", {
        tags: ["AI"],
        operationId: "updateAiSettings",
        security: sessionAuth,
        description:
          "Update org AI provider, model selection, custom instructions, or memory toggles.",
        requestBody: jsonBody(updateAiSettingsSchema),
        responses: jsonResp(200, { type: "object", additionalProperties: true }),
      }),
    },
    "/ai/settings/key": {
      delete: op("Clear AI API key", {
        tags: ["AI"],
        operationId: "deleteAiSettingsKey",
        security: sessionAuth,
        description: "Remove custom BYOK provider API key.",
        responses: jsonResp(200, { type: "object", additionalProperties: true }),
      }),
    },
    "/ai/billing": {
      get: op("AI provider billing/balance", {
        tags: ["AI"],
        operationId: "getAiBilling",
        security: sessionAuth,
        description: "Fetch DeepSeek/OpenAI balance and quota status.",
        responses: jsonResp(200, { type: "object", additionalProperties: true }),
      }),
    },
    "/ai/memory": {
      get: op("List organization AI memory", {
        tags: ["AI"],
        operationId: "listAiMemory",
        security: sessionAuth,
        description: "List shared organization AI memory items.",
        responses: jsonResp(200, {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  content: { type: "string" },
                  source: { type: "string" },
                  createdAt: { type: "string", format: "date-time" },
                  scope: { type: "string" },
                },
              },
            },
          },
        }),
      }),
      post: op("Add organization AI memory", {
        tags: ["AI"],
        operationId: "createAiMemory",
        security: sessionAuth,
        description: "Add a persistent memory note to the organization AI context.",
        requestBody: jsonBody({
          type: "object",
          required: ["content"],
          properties: { content: { type: "string" } },
        }),
        responses: jsonResp(200, { type: "object", additionalProperties: true }),
      }),
      delete: op("Clear organization AI memory", {
        tags: ["AI"],
        operationId: "clearAiMemory",
        security: sessionAuth,
        description: "Clear all organization shared AI memory items.",
        responses: jsonResp(200, {
          type: "object",
          properties: { cleared: { type: "integer" } },
        }),
      }),
    },
    "/ai/memory/{id}": {
      delete: op("Delete organization AI memory item", {
        tags: ["AI"],
        operationId: "deleteAiMemory",
        security: sessionAuth,
        description: "Remove a single AI memory note by ID.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 204: { description: "Deleted" } },
      }),
    },
    "/ai/memory/personal": {
      get: op("List personal AI memory", {
        tags: ["AI"],
        operationId: "listPersonalAiMemory",
        security: sessionAuth,
        description: "List personal musician AI memory items.",
        responses: jsonResp(200, {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  content: { type: "string" },
                  source: { type: "string" },
                  createdAt: { type: "string", format: "date-time" },
                  scope: { type: "string" },
                },
              },
            },
          },
        }),
      }),
      post: op("Add personal AI memory", {
        tags: ["AI"],
        operationId: "createPersonalAiMemory",
        security: sessionAuth,
        description: "Save a personal preference or context item for AI.",
        requestBody: jsonBody({
          type: "object",
          required: ["content"],
          properties: { content: { type: "string" } },
        }),
        responses: jsonResp(200, { type: "object", additionalProperties: true }),
      }),
      delete: op("Clear personal AI memory", {
        tags: ["AI"],
        operationId: "clearPersonalAiMemory",
        security: sessionAuth,
        description: "Clear all personal AI memory items.",
        responses: jsonResp(200, {
          type: "object",
          properties: { cleared: { type: "integer" } },
        }),
      }),
    },
    "/ai/memory/personal/{id}": {
      delete: op("Delete personal AI memory item", {
        tags: ["AI"],
        operationId: "deletePersonalAiMemory",
        security: sessionAuth,
        description: "Delete a personal AI memory entry by ID.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 204: { description: "Deleted" } },
      }),
    },
    "/ai/confirm": {
      post: op("Confirm staged AI destructive action", {
        tags: ["AI"],
        operationId: "confirmAiAction",
        security: sessionAuth,
        description: "Validate and execute a user-confirmed destructive AI tool action.",
        requestBody: jsonBody(aiConfirmActionSchema),
        responses: jsonResp(200, { type: "object", additionalProperties: true }),
      }),
    },
    "/ai/chat": {
      post: op("AI chat stream (UI message stream)", {
        tags: ["AI"],
        operationId: "aiChat",
        security: sessionAuth,
        description:
          "Streaming worship assistant conversation supporting tool calls and UI messages.",
        requestBody: jsonBody({
          type: "object",
          required: ["messages"],
          properties: {
            messages: {
              type: "array",
              minItems: 1,
              maxItems: 200,
              items: { type: "object", additionalProperties: true },
            },
            context: { type: "object", additionalProperties: true },
            locale: { type: "string", enum: ["pt", "en", "es"] },
          },
        }),
        responses: {
          200: {
            description: "UI message stream",
            content: { "text/plain": { schema: { type: "string" } } },
          },
        },
      }),
    },
  };
}
