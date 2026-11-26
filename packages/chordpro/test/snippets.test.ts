// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { lintChordPro } from "../src/parser/linter";

/**
 * Strip Ace snippet tab-stop tokens and return the plain text the snippet
 * would expand to after all placeholders are filled with their default values.
 */
function expandSnippet(body: string): string {
  return body
    .replace(/\$\{(\d+):([^}]*)\}/g, "$2")
    .replace(/\$\{(\d+)\}/g, "")
    .replace(/\$\d+/g, "");
}

function parseSnippets(snippetText: string): Map<string, string> {
  const map = new Map<string, string>();
  const lines = snippetText.split("\n");
  let currentTrigger: string | null = null;
  const bodyLines: string[] = [];

  function flush() {
    if (currentTrigger !== null) {
      map.set(currentTrigger, expandSnippet(bodyLines.join("\n").replace(/^\t/gm, "")));
    }
  }

  for (const line of lines) {
    if (line.startsWith("snippet ")) {
      flush();
      currentTrigger = line.slice("snippet ".length).trim();
      bodyLines.length = 0;
    } else if (currentTrigger !== null) {
      bodyLines.push(line);
    }
  }
  flush();
  return map;
}

let snippets = new Map<string, string>();

before(async () => {
  const { registerChordproSnippets } = await import("../src/editor/snippets-chordpro.js");

  const capturedExports: { snippetText?: string } = {};
  const fakeAce = {
    define(_id: string, _deps: string[], factory: (...args: unknown[]) => void) {
      factory(() => {}, capturedExports, {});
    },
    _chordproSnippetsRegistered: false,
  };

  await registerChordproSnippets(
    fakeAce as unknown as Parameters<typeof registerChordproSnippets>[0],
  );
  snippets = parseSnippets(capturedExports.snippetText ?? "");
});

function assertClean(trigger: string) {
  const body = snippets.get(trigger);
  assert.ok(body !== undefined, `Snippet "${trigger}" not found`);
  const diags = lintChordPro(body);
  const errors = diags.filter((d) => d.severity === "error");
  assert.deepEqual(
    errors,
    [],
    `Snippet "${trigger}" produced lint errors:\n${errors.map((e) => `  [${e.code}] line ${e.line}: ${e.message}`).join("\n")}`,
  );
}

// ─── Template ─────────────────────────────────────────────────────────────────

describe("snippets — template", () => {
  it("! expands to a valid song with no lint errors", () => assertClean("!"));
});

// ─── Metadata directives ──────────────────────────────────────────────────────

describe("snippets — metadata", () => {
  for (const trigger of [
    "title",
    "t",
    "subtitle",
    "st",
    "artist",
    "a",
    "composer",
    "lyricist",
    "arranger",
    "translator",
    "album",
    "year",
    "copyright",
    "ccli",
    "key",
    "k",
    "original_key",
    "capo",
    "keyshift",
    "tempo",
    "time",
    "duration",
    "youtube",
    "song_number",
    "number",
    "tags",
    "keynote",
    "meta",
  ]) {
    it(`${trigger} expands without lint errors`, () => assertClean(trigger));
  }
});

// ─── Comment directives ───────────────────────────────────────────────────────

describe("snippets — comments", () => {
  for (const trigger of ["comment", "ci", "comment_italic", "comment_box"]) {
    it(`${trigger} expands without lint errors`, () => assertClean(trigger));
  }
});

// ─── Section blocks ───────────────────────────────────────────────────────────

describe("snippets — section blocks", () => {
  for (const trigger of [
    "chorus",
    "verse",
    "bridge",
    "intro",
    "outro",
    "lead",
    "refrain",
    "middle",
    "part",
    "version",
    "tab",
    "grid",
  ]) {
    it(`${trigger} block expands without lint errors`, () => assertClean(trigger));
  }
});

// ─── Block delimiters (registered but intentionally unclosed in isolation) ────

describe("snippets — block delimiters registered", () => {
  for (const trigger of [
    "soc",
    "eoc",
    "sov",
    "eov",
    "sob",
    "eob",
    "sot",
    "eot",
    "sog",
    "eog",
    "sol",
    "eol",
    "sor",
    "eor",
    "som",
    "eom",
    "sop",
    "eop",
    "soe",
    "eoe",
  ]) {
    it(`${trigger} is registered`, () => {
      assert.ok(snippets.has(trigger), `Snippet "${trigger}" not found`);
    });
  }
});

// ─── Chord / lyric helpers ────────────────────────────────────────────────────

describe("snippets — chord helpers", () => {
  it("[ inserts a chord bracket", () => {
    const body = snippets.get("[");
    assert.ok(body !== undefined, 'Snippet "[" not found');
    assert.ok(body.includes("[") && body.includes("]"));
  });

  it("|| inserts a grid bar line", () => {
    const body = snippets.get("||");
    assert.ok(body !== undefined, 'Snippet "||" not found');
    assert.ok(body.includes("||"));
  });

  it("cc is registered (chorus recall)", () => assert.ok(snippets.has("cc")));
  it("repeat_chorus is registered", () => assert.ok(snippets.has("repeat_chorus")));
  it("repeat expands without lint errors", () => assertClean("repeat"));
  it("re expands without lint errors", () => assertClean("re"));
});

// ─── Chord define ─────────────────────────────────────────────────────────────

describe("snippets — chord define", () => {
  it("define expands without lint errors", () => assertClean("define"));
  it("d expands without lint errors", () => assertClean("d"));
});

// ─── Layout ───────────────────────────────────────────────────────────────────

describe("snippets — layout", () => {
  for (const trigger of ["column_break", "cb", "new_page", "np", "new_physical_page"]) {
    it(`${trigger} is registered`, () => {
      assert.ok(snippets.has(trigger), `Snippet "${trigger}" not found`);
    });
  }
});

// ─── Typography ───────────────────────────────────────────────────────────────

describe("snippets — typography", () => {
  for (const trigger of [
    "textsize",
    "chordsize",
    "tabsize",
    "gridsize",
    "textcolor",
    "chordcolor",
  ]) {
    it(`${trigger} expands without lint errors`, () => assertClean(trigger));
  }
});

// ─── Completeness: every registered trigger has a non-empty body ──────────────

describe("snippets — completeness", () => {
  it("every snippet has a non-empty body", () => {
    for (const [trigger, body] of snippets) {
      assert.ok(body.trim().length > 0, `Snippet "${trigger}" has an empty body`);
    }
  });
});
