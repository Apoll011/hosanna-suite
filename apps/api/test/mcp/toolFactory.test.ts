import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { z } from "zod";
import type { AuthInfo } from "@modelcontextprotocol/server";
import { clearDomainPacks, registerDomainPack } from "../../src/mcp/domains/registry.js";
import { createSharedEmbeddedTools } from "../../src/mcp/domains/toolFactory.js";

const auth = {} as AuthInfo;
const pack = (defs: unknown[]) =>
  registerDomainPack({ id: "test.shared", title: "t", permissions: [], tools: [], toolFactory: () => defs as never });
const def = (over: object = {}) => ({
  name: "funds_search", description: "d", inputSchema: z.object({}), execute: () => ({ ok: 1 }), ...over,
});

describe("shared tool factory", () => {
  afterEach(() => clearDomainPacks());

  it("exposes a pack tool on the embedded surface", () => {
    pack([def()]);
    assert.ok("funds_search" in createSharedEmbeddedTools(auth));
  });
  it("rejects a non-zod schema instead of silently accepting no params", () => {
    pack([def({ inputSchema: {} })]);
    assert.throws(() => createSharedEmbeddedTools(auth), /zod inputSchema/);
  });
  it("rejects name collisions with existing tools", () => {
    pack([def()]);
    assert.throws(() => createSharedEmbeddedTools(auth, {}, ["funds_search"]), /Duplicate/);
  });
  it("enforces permission before execute", async () => {
    pack([def({ permission: "fund.update" })]);
    const t = createSharedEmbeddedTools(auth)["funds_search"] as { execute: (i: unknown, o: unknown) => Promise<unknown> };
    await assert.rejects(() => t.execute({}, {}), /Authentication required/);
  });
});
