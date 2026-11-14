import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildApiOpenApiDoc, getApiPaths } from "../src/openapi/index.js";

describe("OpenAPI document builder", () => {
  it("builds valid OpenAPI 3.1 specification document", () => {
    const doc = buildApiOpenApiDoc();

    assert.equal(doc.openapi, "3.1.0");
    assert.equal(doc.info.title, "Hosanna API");
    assert.ok(doc.paths, "doc must contain paths");
    assert.ok(doc.components?.schemas, "doc must contain component schemas");
  });

  it("contains all core domain paths", () => {
    const paths = getApiPaths();
    const expectedRoutes = [
      "/health",
      "/cron/purge-trash",
      "/songs",
      "/songs/batch",
      "/songs/batch-tags",
      "/songs/{id}",
      "/songs/{id}/download",
      "/songs/{id}/move",
      "/folders",
      "/folders/flat",
      "/folders/{id}",
      "/services",
      "/services/{id}",
      "/services/{id}/elements",
      "/services/{id}/notes",
      "/annotation/services/{serviceId}/songs/{songId}/annotation",
      "/replication/{collection}/pull",
      "/replication/pull",
      "/replication/{collection}/push",
      "/trash",
      "/ai/settings",
      "/ai/billing",
      "/ai/memory",
      "/ai/confirm",
      "/ai/chat",
      "/youtube/duration",
      "/cifra",
    ];

    for (const route of expectedRoutes) {
      assert.ok(paths[route], `Missing route: ${route}`);
    }
  });

  it("exports required component schemas derived from Zod", () => {
    const doc = buildApiOpenApiDoc();
    const schemas = doc.components.schemas;

    for (const schemaName of [
      "Error",
      "Checkpoint",
      "Song",
      "Folder",
      "Service",
      "ServiceElement",
      "ServiceNote",
      "Collection",
      "AgendaEvent",
      "ReplicationCollection",
      "PullRequest",
      "PullResponse",
      "ChangeRow",
      "AnnotationGetResponse",
      "SongImportJob",
    ]) {
      assert.ok(schemas[schemaName], `Missing component schema: ${schemaName}`);
      assert.equal(typeof schemas[schemaName], "object");
      assert.ok(
        schemas[schemaName].type || schemas[schemaName].anyOf || schemas[schemaName].enum,
        `${schemaName} must have a type, anyOf, or enum`,
      );
    }
  });
});
