/**
 * @license
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ALL_MCP_TOOL_NAMES } from "../../src/mcp/lib/toolCatalog.js";
import type { AuthInfo, McpServer } from "@modelcontextprotocol/server";
import { createSharedEmbeddedTools } from "../../src/mcp/domains/toolFactory.js";
import { MCP_TOOL_GROUPS } from "../../src/mcp/lib/toolCatalog.js";
import { AiMemoryService } from "../../src/services/aiMemory.service.js";
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

  it("filters shared tools for Auth, Music, Planning, and unknown hosts", () => {
    const authInfo = {} as AuthInfo;
    const auth = createSharedEmbeddedTools(authInfo, { appId: "auth" });
    const authWithMemory = createSharedEmbeddedTools(authInfo, {
      appId: "auth",
      memory: new AiMemoryService(),
    });
    const hostCapabilities = [
      "catalog.songs",
      "catalog.services",
      "editor.songs",
      "editor.services",
      "navigate.local",
      "print",
      "library.sync",
    ];
    const music = createSharedEmbeddedTools(authInfo, {
      appId: "music",
      capabilities: hostCapabilities,
    });
    const planning = createSharedEmbeddedTools(authInfo, {
      appId: "planning",
      capabilities: hostCapabilities,
    });
    const unknown = createSharedEmbeddedTools(authInfo, { appId: "unrecognized" });
    const allMusicAndPlanning = new Set([...Object.keys(music), ...Object.keys(planning)]);

    assert.ok(MCP_TOOL_GROUPS.discovery.every((name) => name in auth));
    assert.ok("open_app" in auth);
    assert.ok("memory_list" in authWithMemory);
    assert.ok(!("memory_list" in auth));
    assert.ok(!ALL_MCP_TOOL_NAMES.some((name) => name.startsWith("memory_")));
    assert.ok(!("studio_navigate" in auth));
    assert.ok("studio_navigate" in music);
    assert.ok("studio_generate_pdf" in planning);
    assert.ok("studio_sync" in music);
    assert.ok(!("studio_search" in unknown));
    assert.ok(ALL_MCP_TOOL_NAMES.every((name) => allMusicAndPlanning.has(name)));
    assert.ok(!("songs_search" in auth));
    assert.ok("songs_search" in music);
    assert.ok(!("services_search" in music));
    assert.ok("services_search" in planning);
    assert.deepEqual(Object.keys(unknown), Object.keys(auth));
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
