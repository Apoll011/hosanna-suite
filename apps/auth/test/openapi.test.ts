import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildAuthOpenApiDoc } from "../lib/openapi/index.js";

describe("auth OpenAPI schema builder", () => {
  it("generates a valid OpenAPI 3.1.0 document", () => {
    const doc = buildAuthOpenApiDoc();

    assert.equal(doc.openapi, "3.1.0");
    assert.equal(doc.info.title, "Hosanna Auth & Services API");
    assert.ok(typeof doc.info.version === "string");
  });

  it("includes all custom auth host domain paths", () => {
    const doc = buildAuthOpenApiDoc();
    const paths = Object.keys(doc.paths);

    assert.ok(paths.includes("/billing/pricing"));
    assert.ok(paths.includes("/billing/entitlement"));
    assert.ok(paths.includes("/cron/agenda-reminders"));
    assert.ok(paths.includes("/backup"));
    assert.ok(paths.includes("/backup/restore"));
    assert.ok(paths.includes("/notifications"));
  });

  it("includes required component schemas", () => {
    const doc = buildAuthOpenApiDoc();

    assert.ok(doc.components.schemas.PlanPricing);
    assert.ok(doc.components.schemas.BackupDocument);
  });
});
