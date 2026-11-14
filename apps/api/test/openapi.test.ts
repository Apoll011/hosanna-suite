import assert from "node:assert/strict";
import { describe, it } from "node:test";
import express from "express";
import { buildApiOpenApiDoc, getApiPaths } from "../src/openapi/index.js";
import { openapiRouter } from "../src/routes/openapi.routes.js";

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

  it("serves /docs with permissive Content-Security-Policy for Scalar and Vercel", async () => {
    const app = express();
    app.use(openapiRouter);

    const server = app.listen(0);
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;

    try {
      const res = await fetch(`http://127.0.0.1:${port}/docs`);
      assert.equal(res.status, 200);
      assert.ok(res.headers.get("content-type")?.includes("text/html"));

      const csp = res.headers.get("content-security-policy");
      assert.ok(csp, "Must contain Content-Security-Policy header");
      assert.ok(csp.includes("https://cdn.jsdelivr.net"), "CSP must permit jsdelivr");
      assert.ok(csp.includes("https://vercel.live"), "CSP must permit vercel live");
      assert.ok(csp.includes("img-src 'self' data: https: blob:"), "CSP must permit external images and data/blob URIs");
    } finally {
      server.close();
    }
  });
});
