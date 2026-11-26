// SPDX-License-Identifier: AGPL-3.0-only
import { idParamSchema } from "../../validators/common.validators.js";
import { jsonResp, op, OpenApiOperation, sessionAuth, zodToPathParams } from "../builder.js";

export function getCollectionPaths(): Record<string, Record<string, OpenApiOperation>> {
  const idParam = zodToPathParams(idParamSchema);

  return {
    "/collections": {
      get: op("List collections", {
        tags: ["Collections"],
        operationId: "listCollections",
        security: sessionAuth,
        description: "Retrieve all non-deleted collections with song counts.",
        responses: jsonResp(200, {
          type: "array",
          items: { $ref: "#/components/schemas/Collection" },
        }),
      }),
    },
    "/collections/{id}": {
      get: op("Get collection", {
        tags: ["Collections"],
        operationId: "getCollection",
        security: sessionAuth,
        description: "Retrieve a collection by ID including its song summaries.",
        parameters: idParam,
        responses: jsonResp(200, { $ref: "#/components/schemas/Collection" }),
      }),
    },
  };
}
