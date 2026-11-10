import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { summarizeDiff } from "../../../src/mcp/lib/diff.js";
import { validateServiceElements } from "../../../src/validators/serviceElement.validators.js";
import { validateChordProContent } from "../../../src/mcp/lib/chordproGate.js";
import { createHosannaMcpServer } from "../../../src/mcp/server.js";

describe("summarizeDiff", () => {
  it("detects unchanged content", () => {
    const result = summarizeDiff("a\nb", "a\nb");
    assert.equal(result.unchanged, true);
    assert.equal(result.preview, "(no changes)");
  });

  it("counts added and removed lines", () => {
    const result = summarizeDiff("a\nb", "a\nc");
    assert.equal(result.unchanged, false);
    assert.ok(result.addedLines >= 1);
    assert.ok(result.removedLines >= 1);
  });

  it("treats empty → content as pure additions", () => {
    const result = summarizeDiff("", "one\ntwo");
    assert.equal(result.unchanged, false);
    assert.equal(result.addedLines, 2);
    assert.equal(result.removedLines, 1); // empty string still yields one "" line
    assert.match(result.preview, /\+ one/);
    assert.match(result.preview, /\+ two/);
  });

  it("caps preview length for large diffs", () => {
    const before = Array.from({ length: 30 }, (_, i) => `old-${i}`).join("\n");
    const after = Array.from({ length: 30 }, (_, i) => `new-${i}`).join("\n");
    const result = summarizeDiff(before, after);
    assert.ok(result.addedLines + result.removedLines > 40);
    assert.match(result.preview, /more line changes/);
    assert.ok(result.preview.split("\n").length <= 41);
  });
});

describe("validateServiceElements", () => {
  it("requires songId for song elements", () => {
    const result = validateServiceElements([{ id: "1", type: "song", title: "Test" }]);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.includes("songId")));
  });

  it("accepts a welcome element", () => {
    const result = validateServiceElements([
      { id: "1", type: "welcome", title: "Welcome", position: 0 },
    ]);
    assert.equal(result.ok, true);
  });
});

describe("validateChordProContent", () => {
  it("accepts a simple valid document", () => {
    const report = validateChordProContent("{title: Test}\n{key: G}\n[G]Hello");
    assert.equal(report.ok, true);
    assert.equal(report.metadata.title, "Test");
  });

  it("reports unclosed braces", () => {
    const report = validateChordProContent("{title: Broken\n[G]Hi");
    assert.equal(report.ok, false);
  });
});

describe("createHosannaMcpServer", () => {
  it("registers without throwing", () => {
    const server = createHosannaMcpServer();
    assert.ok(server);
    assert.equal(typeof server.registerTool, "function");
  });
});
