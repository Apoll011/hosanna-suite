import { op, jsonResp, OpenApiOperation } from "../builder.js";

export function getHealthPaths(): Record<string, Record<string, OpenApiOperation>> {
  return {
    "/health": {
      get: op("Health check", {
        tags: ["Health"],
        operationId: "getHealth",
        security: [],
        description:
          "Returns API service health, database connectivity status, and server timestamp.",
        responses: jsonResp(200, {
          type: "object",
          properties: {
            status: { type: "string", example: "ok" },
            timestamp: { type: "string", format: "date-time" },
          },
        }),
      }),
    },
  };
}
