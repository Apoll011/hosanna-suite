import { idParamSchema } from "../../validators/common.validators.js";
import {
  createFolderSchema,
  deleteFolderQuerySchema,
  updateFolderSchema,
} from "../../validators/folder.validators.js";
import {
  jsonBody,
  jsonResp,
  op,
  OpenApiOperation,
  sessionAuth,
  zodToPathParams,
  zodToQueryParams,
} from "../builder.js";

export function getFolderPaths(): Record<string, Record<string, OpenApiOperation>> {
  const idParam = zodToPathParams(idParamSchema);

  return {
    "/folders": {
      get: op("List folders", {
        tags: ["Folders"],
        operationId: "listFolders",
        security: sessionAuth,
        description: "Retrieve complete folder hierarchy with song and subfolder counts.",
        responses: jsonResp(200, {
          type: "array",
          items: { $ref: "#/components/schemas/Folder" },
        }),
      }),
      post: op("Create folder", {
        tags: ["Folders"],
        operationId: "createFolder",
        security: sessionAuth,
        description: "Create a new folder in library root or as a child of parentId.",
        requestBody: jsonBody(createFolderSchema),
        responses: jsonResp(201, { $ref: "#/components/schemas/Folder" }),
      }),
    },
    "/folders/flat": {
      get: op("List folders flat", {
        tags: ["Folders"],
        operationId: "listFoldersFlat",
        security: sessionAuth,
        description: "Retrieve a flat unnested list of all folders in the active organization.",
        responses: jsonResp(200, {
          type: "array",
          items: { $ref: "#/components/schemas/Folder" },
        }),
      }),
    },
    "/folders/{id}": {
      put: op("Update folder", {
        tags: ["Folders"],
        operationId: "updateFolder",
        security: sessionAuth,
        description: "Update folder name, color, icon, or parent location with concurrency check.",
        parameters: idParam,
        requestBody: jsonBody(updateFolderSchema),
        responses: jsonResp(200, { $ref: "#/components/schemas/Folder" }),
      }),
      delete: op("Delete folder", {
        tags: ["Folders"],
        operationId: "deleteFolder",
        security: sessionAuth,
        description: "Delete folder according to the action query strategy.",
        parameters: [...idParam, ...zodToQueryParams(deleteFolderQuerySchema)],
        responses: jsonResp(200, { type: "object", additionalProperties: true }),
      }),
    },
    "/folders/{id}/move-content-to-root": {
      delete: op("Delete folder moving content to root", {
        tags: ["Folders"],
        operationId: "deleteFolderMoveContentToRoot",
        security: sessionAuth,
        description: "Delete folder and move its songs and subfolders to organization root.",
        parameters: idParam,
        responses: jsonResp(200, {
          type: "object",
          properties: {
            movedSongs: { type: "integer" },
            movedFolders: { type: "integer" },
          },
        }),
      }),
    },
    "/folders/{id}/with-content": {
      delete: op("Delete folder with content", {
        tags: ["Folders"],
        operationId: "deleteFolderWithContent",
        security: sessionAuth,
        description: "Cascade delete a folder and all contained songs and subfolders into trash.",
        parameters: idParam,
        responses: jsonResp(200, { type: "object", additionalProperties: true }),
      }),
    },
  };
}
