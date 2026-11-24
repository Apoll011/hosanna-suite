import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { z } from "zod";
import type { AuthInfo } from "@modelcontextprotocol/server";
import type { McpServer } from "@modelcontextprotocol/server";
import { clearDomainPacks, registerDomainPack } from "../../src/mcp/domains/registry.js";
import { createSharedEmbeddedTools, mountSharedDomainTools } from "../../src/mcp/domains/toolFactory.js";

const auth = {} as AuthInfo;
const pack = (defs: unknown[]) =>
  registerDomainPack({
    id: "test.shared",
    title: "t",
    app: "music",
    permissions: [],
    tools: [],
    toolFactory: () => defs as never,
  });
const def = (over: object = {}) => ({
  name: "funds_search",
  description: "d",
  inputSchema: z.object({}),
  execute: () => ({ ok: 1 }),
  ...over,
});

describe("shared tool factory", () => {
  afterEach(() => clearDomainPacks());

  it("exposes a pack tool on the embedded surface", () => {
    pack([def()]);
    assert.ok("funds_search" in createSharedEmbeddedTools(auth, { appId: "music" }));
  });
  it("limits embedded tools to the hosting app and suite-wide tools", () => {
    pack([
      def({ name: "suite_tool", apps: "suite" }),
      def({ name: "music_tool", apps: ["music"] }),
    ]);
    assert.deepEqual(Object.keys(createSharedEmbeddedTools(auth, { appId: "auth" })), ["suite_tool"]);
    assert.deepEqual(Object.keys(createSharedEmbeddedTools(auth, { appId: "music" })), ["suite_tool", "music_tool"]);
    assert.deepEqual(Object.keys(createSharedEmbeddedTools(auth, { appId: "unknown" })), ["suite_tool"]);
  });
  it("never exposes UI directives on MCP", () => {
    pack([def({ name: "host_directive", ui: true })]);
    const registered: string[] = [];
    const server = {
      registerTool: (name: string) => registered.push(name),
    } as unknown as McpServer;
    mountSharedDomainTools(server);
    assert.ok(!registered.includes("host_directive"));
  });
  it("rejects a non-zod schema instead of silently accepting no params", () => {
    pack([def({ inputSchema: {} })]);
    assert.throws(() => createSharedEmbeddedTools(auth, { appId: "music" }), /zod inputSchema/);
  });
  it("rejects name collisions with existing tools", () => {
    pack([def()]);
    assert.throws(() => createSharedEmbeddedTools(auth, { appId: "music" }, ["funds_search"]), /Duplicate/);
  });
  it("enforces permission before execute", async () => {
    pack([def({ permission: "fund.update" })]);
    const t = createSharedEmbeddedTools(auth, { appId: "music" })["funds_search"] as {
      execute: (i: unknown, o: unknown) => Promise<unknown>;
    };
    await assert.rejects(() => t.execute({}, {}), /Authentication required/);
  });
});
