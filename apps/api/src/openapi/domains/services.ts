import { idParamSchema } from "../../validators/common.validators.js";
import {
  createServiceSchema,
  updateServiceElementsSchema,
  updateServiceSchema,
} from "../../validators/service.validators.js";
import {
  jsonBody,
  jsonResp,
  op,
  OpenApiOperation,
  sessionAuth,
  zodToPathParams,
} from "../builder.js";

export function getServicePaths(): Record<string, Record<string, OpenApiOperation>> {
  const serviceIdParam = zodToPathParams(idParamSchema);
  const notePathParams = [
    { name: "id", in: "path" as const, required: true, schema: { type: "string", format: "uuid" } },
    { name: "noteId", in: "path" as const, required: true, schema: { type: "string", format: "uuid" } },
  ];

  return {
    "/services": {
      get: op("List services", {
        tags: ["Services"],
        operationId: "listServices",
        security: sessionAuth,
        description: "List scheduled services with optional archived status filter.",
        parameters: [{ name: "archived", in: "query", schema: { type: "boolean", default: false } }],
        responses: jsonResp(200, {
          type: "array",
          items: { $ref: "#/components/schemas/Service" },
        }),
      }),
      post: op("Create service", {
        tags: ["Services"],
        operationId: "createService",
        security: sessionAuth,
        description: "Create an order of service with service date and optional element sequence.",
        requestBody: jsonBody({
          type: "object",
          required: ["name", "date"],
          properties: {
            name: { type: "string" },
            date: { type: "string" },
            notes: { type: "string" },
            elements: {
              type: "array",
              items: { $ref: "#/components/schemas/ServiceElement" },
            },
          },
        }),
        responses: jsonResp(201, { $ref: "#/components/schemas/Service" }),
      }),
    },
    "/services/{id}": {
      get: op("Get service", {
        tags: ["Services"],
        operationId: "getService",
        security: sessionAuth,
        description: "Retrieve a service order and its ordered elements by UUID.",
        parameters: serviceIdParam,
        responses: jsonResp(200, { $ref: "#/components/schemas/Service" }),
      }),
      put: op("Update service", {
        tags: ["Services"],
        operationId: "updateService",
        security: sessionAuth,
        description: "Update service details, notes, or archived status with concurrency check.",
        parameters: serviceIdParam,
        requestBody: jsonBody(updateServiceSchema),
        responses: jsonResp(200, { $ref: "#/components/schemas/Service" }),
      }),
      delete: op("Delete service", {
        tags: ["Services"],
        operationId: "deleteService",
        security: sessionAuth,
        description: "Soft-delete service into trash.",
        parameters: serviceIdParam,
        responses: { 204: { description: "Deleted" } },
      }),
    },
    "/services/{id}/elements": {
      put: op("Replace service elements", {
        tags: ["Services"],
        operationId: "updateServiceElements",
        security: sessionAuth,
        description: "Reorder or replace the full element sequence for a service.",
        parameters: serviceIdParam,
        requestBody: jsonBody({
          type: "object",
          required: ["updatedAt", "elements"],
          properties: {
            updatedAt: { type: "string", format: "date-time" },
            elements: {
              type: "array",
              items: { $ref: "#/components/schemas/ServiceElement" },
            },
          },
        }),
        responses: jsonResp(200, { $ref: "#/components/schemas/Service" }),
      }),
    },
    "/services/{id}/notes": {
      get: op("List service notes", {
        tags: ["ServiceNotes"],
        operationId: "listServiceNotes",
        security: sessionAuth,
        description: "List musician and team notes attached to a service or specific element.",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "elementId", in: "query", schema: { type: "string", format: "uuid" } },
          {
            name: "scope",
            in: "query",
            schema: { type: "string", enum: ["all", "service"], default: "all" },
          },
        ],
        responses: jsonResp(200, {
          type: "array",
          items: { $ref: "#/components/schemas/ServiceNote" },
        }),
      }),
      post: op("Create service note", {
        tags: ["ServiceNotes"],
        operationId: "createServiceNote",
        security: sessionAuth,
        description: "Attach a new collaborative note to a service or service element.",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: jsonBody({
          type: "object",
          required: ["body"],
          properties: {
            body: { type: "string", minLength: 1, maxLength: 10000 },
            elementId: { type: "string", format: "uuid", nullable: true },
            private: { type: "boolean", default: false },
          },
        }),
        responses: jsonResp(201, { $ref: "#/components/schemas/ServiceNote" }),
      }),
    },
    "/services/{id}/notes/{noteId}": {
      put: op("Update service note", {
        tags: ["ServiceNotes"],
        operationId: "updateServiceNote",
        security: sessionAuth,
        description: "Edit text or privacy of an existing service note.",
        parameters: notePathParams,
        requestBody: jsonBody({
          type: "object",
          properties: { body: { type: "string" }, private: { type: "boolean" } },
        }),
        responses: jsonResp(200, { $ref: "#/components/schemas/ServiceNote" }),
      }),
      delete: op("Delete service note", {
        tags: ["ServiceNotes"],
        operationId: "deleteServiceNote",
        security: sessionAuth,
        description: "Delete a service note.",
        parameters: notePathParams,
        responses: { 204: { description: "Deleted" } },
      }),
    },
  };
}
