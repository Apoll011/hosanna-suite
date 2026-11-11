/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ALL_MCP_TOOL_NAMES } from "../../src/mcp/lib/toolCatalog.js";
import {
  assertPackToolsCoverCatalog,
  ensureDomainPacksRegistered,
  listDomainPacks,
  permissionsReportForUser,
  summarizeDomainsForUser,
} from "../../src/mcp/domains/index.js";

describe("MCP domain packs", () => {
  it("registers packs covering every catalog tool name", () => {
    ensureDomainPacksRegistered();
    const missing = assertPackToolsCoverCatalog(ALL_MCP_TOOL_NAMES);
    assert.deepEqual(missing, [], `packs missing tools: ${missing.join(", ")}`);
  });

  it("exposes music.song and music.service with logosKind", () => {
    ensureDomainPacksRegistered();
    const packs = listDomainPacks();
    const song = packs.find((p) => p.id === "music.song");
    const service = packs.find((p) => p.id === "music.service");
    assert.equal(song?.logosKind, "song");
    assert.equal(service?.logosKind, "service");
    assert.ok((song?.tools.length ?? 0) > 0);
    assert.ok((service?.tools.length ?? 0) > 0);
  });

  it("marks guest song.update tools as denied", () => {
    const domains = summarizeDomainsForUser({ role: "guest" });
    const song = domains.find((d) => d.id === "music.song");
    assert.ok(song);
    const propose = song!.tools.find((t) => t.name === "songs_propose_edit");
    const search = song!.tools.find((t) => t.name === "songs_search");
    assert.equal(propose?.allowed, false);
    assert.equal(search?.allowed, true);
  });

  it("permissions report lists allowed tools for owner", () => {
    const report = permissionsReportForUser({ orgRole: "owner" });
    assert.ok(report.allowed.includes("song.update"));
    assert.equal(report.denied.length, 0);
    assert.ok(report.tools.allowed.includes("songs_propose_edit"));
    assert.equal(report.tools.denied.length, 0);
  });
});
