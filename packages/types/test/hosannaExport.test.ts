// SPDX-License-Identifier: AGPL-3.0-only
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  HOSANNA_EXPORT_CURRENT_VERSION,
  HOSANNA_EXPORT_FORMAT,
  HOSANNA_EXPORT_MAX_BYTES,
  parseHosannaExport,
  parseHosannaExportJson,
} from "../src/index";

describe("hosannaExport", () => {
  it("parses a valid v1 export document and applies defaults", () => {
    const result = parseHosannaExport({
      format: HOSANNA_EXPORT_FORMAT,
      version: HOSANNA_EXPORT_CURRENT_VERSION,
      exportedAt: "2026-11-25T00:00:00.000Z",
      songs: [{ id: "s1", title: "  Amazing Grace  ", content: "[C]Amazing grace" }],
    });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.deepEqual(result.data.folders, []);
    assert.deepEqual(result.data.collections, []);
    assert.equal(result.data.songs[0]?.title, "Amazing Grace");
    assert.equal(result.data.songs[0]?.artist, "");
    assert.equal(result.data.songs[0]?.folderId, null);
    assert.deepEqual(result.data.songs[0]?.tags, []);
  });

  it("rejects non-objects and invalid format", () => {
    for (const input of [null, [], "str", { format: "other", version: 1 }]) {
      const result = parseHosannaExport(input);
      assert.equal(result.ok, false);
      if (!result.ok) assert.equal(result.code, "invalid_format");
    }
  });

  it("rejects unsupported version with foundVersion", () => {
    const result = parseHosannaExport({
      format: HOSANNA_EXPORT_FORMAT,
      version: 99,
      exportedAt: "2026-11-25T00:00:00.000Z",
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "unsupported_version");
      assert.equal(result.foundVersion, 99);
    }
  });

  it("rejects invalid schema fields", () => {
    const result = parseHosannaExport({
      format: HOSANNA_EXPORT_FORMAT,
      version: HOSANNA_EXPORT_CURRENT_VERSION,
      exportedAt: "",
    });

    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, "invalid_schema");
  });

  it("parses valid JSON and rejects malformed JSON or oversized payloads", () => {
    const ok = parseHosannaExportJson(
      JSON.stringify({
        format: HOSANNA_EXPORT_FORMAT,
        version: HOSANNA_EXPORT_CURRENT_VERSION,
        exportedAt: "2026-11-25T00:00:00.000Z",
      }),
    );
    assert.equal(ok.ok, true);

    const badJson = parseHosannaExportJson("{not json");
    assert.equal(badJson.ok, false);
    if (!badJson.ok) assert.equal(badJson.code, "malformed_json");

    const tooLarge = parseHosannaExportJson("{}", HOSANNA_EXPORT_MAX_BYTES + 1);
    assert.equal(tooLarge.ok, false);
    if (!tooLarge.ok) assert.equal(tooLarge.code, "file_too_large");
  });
});
