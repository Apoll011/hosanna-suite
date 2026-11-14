import {
  jsonBody,
  jsonResp,
  op,
  OpenApiOperation,
  sessionAuth,
} from "../builder.js";

export function getReplicationPaths(): Record<string, Record<string, OpenApiOperation>> {
  return {
    "/replication/{collection}/pull": {
      post: op("Pull one collection", {
        tags: ["Replication"],
        operationId: "pullCollection",
        security: sessionAuth,
        description: "Pull changes for a single collection since the supplied checkpoint.",
        parameters: [
          {
            name: "collection",
            in: "path",
            required: true,
            schema: { $ref: "#/components/schemas/ReplicationCollection" },
          },
        ],
        requestBody: jsonBody({ $ref: "#/components/schemas/PullRequest" }),
        responses: jsonResp(200, { $ref: "#/components/schemas/PullResponse" }),
      }),
    },
    "/replication/pull": {
      post: op("Pull multiple collections", {
        tags: ["Replication"],
        operationId: "pullAllCollections",
        security: sessionAuth,
        description: "Pull updates across multiple collections in a single round-trip.",
        requestBody: jsonBody({
          type: "object",
          properties: {
            checkpoints: {
              type: "object",
              additionalProperties: { $ref: "#/components/schemas/Checkpoint" },
            },
            limit: { type: "integer", minimum: 1, maximum: 2000 },
          },
        }),
        responses: jsonResp(200, {
          type: "object",
          additionalProperties: { $ref: "#/components/schemas/PullResponse" },
        }),
      }),
    },
    "/replication/{collection}/push": {
      post: op("Push one collection", {
        tags: ["Replication"],
        operationId: "pushCollection",
        security: sessionAuth,
        description: "Push local change rows to the server for replication merge.",
        parameters: [
          {
            name: "collection",
            in: "path",
            required: true,
            schema: { $ref: "#/components/schemas/ReplicationCollection" },
          },
        ],
        requestBody: jsonBody({
          type: "object",
          required: ["changeRows"],
          properties: {
            changeRows: {
              type: "array",
              minItems: 1,
              maxItems: 2000,
              items: { $ref: "#/components/schemas/ChangeRow" },
            },
          },
        }),
        responses: jsonResp(200, {
          type: "array",
          items: { type: "object", additionalProperties: true },
          description: "Conflict documents (empty if all accepted)",
        }),
      }),
    },
  };
}
