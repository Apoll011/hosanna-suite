import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { openAppDirective } from "../../src/mcp/lib/openApp.js";
import { STUDIO_ONLY_TOOLS } from "../../src/mcp/lib/toolCatalog.js";

describe("openAppDirective", () => {
  it("maps saas to path defaults and same tab", () => {
    const d = openAppDirective({ app: "saas" });
    assert.equal(d.openApp, true);
    assert.equal(d.app, "saas");
    assert.equal(d.path, "/");
    assert.equal(d.openIn, "same");
  });

  it("normalizes app slug and path", () => {
    const d = openAppDirective({
      app: " Studio ",
      path: "org/songs",
      openIn: "new",
      reason: "go",
    });
    assert.equal(d.app, "studio");
    assert.equal(d.path, "/org/songs");
    assert.equal(d.openIn, "new");
    assert.equal(d.reason, "go");
  });

  it("is listed as a host-only (non-MCP) tool", () => {
    assert.ok((STUDIO_ONLY_TOOLS as readonly string[]).includes("open_app"));
  });
});
