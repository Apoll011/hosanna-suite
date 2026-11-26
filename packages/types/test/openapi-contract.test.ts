// SPDX-License-Identifier: AGPL-3.0-only
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import { parse } from "yaml";

type OpenApiContract = {
  openapi: string;
  paths: Record<string, Record<string, { operationId?: string; responses?: Record<string, unknown> }>>;
  components?: { schemas?: Record<string, unknown> };
};
const contract = parse<OpenApiContract>(await readFile(new URL("../openapi.yaml", import.meta.url), "utf8"));

describe("OpenAPI contract", () => {
  it("declares an OpenAPI version, paths, and reusable schemas", () => {
    assert.match(contract.openapi, /^3\\./);
    assert.ok(Object.keys(contract.paths).length > 0);
    assert.ok(Object.keys(contract.components?.schemas ?? {}).length > 0);
  });

  it("gives each operation an id and a documented response", () => {
    const ids = new Set<string>();
    for (const [path, pathItem] of Object.entries(contract.paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        if (!["get", "post", "put", "patch", "delete"].includes(method)) continue;
        assert.ok(operation.operationId, `${method.toUpperCase()} ${path} has an operationId`);
        assert.ok(operation.responses && Object.keys(operation.responses).length > 0, `${method.toUpperCase()} ${path} has responses`);
        assert.ok(!ids.has(operation.operationId), `duplicate operationId: ${operation.operationId}`);
        ids.add(operation.operationId);
      }
    }
  });
});
