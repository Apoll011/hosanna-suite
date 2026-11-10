import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  lyricsMatchQuery,
  normalizeLyricQuery,
  stripChordProForSearch,
} from "../../src/lib/lyricSearch.js";

describe("stripChordProForSearch", () => {
  it("strips chords and collapses whitespace", () => {
    const content =
      "{title: Exemplo}\n\nPois [D9]só Tu és o [C#m]Deus eterno,\n[Bm7]digno de [E]louvor";
    assert.equal(
      stripChordProForSearch(content).includes("pois só tu és o deus eterno"),
      true,
    );
  });

  it("removes empty and stacked chord markers", () => {
    assert.equal(stripChordProForSearch("[G][][Am]Hi"), "hi");
    assert.equal(stripChordProForSearch("[G][C][D]Amen"), "amen");
  });

  it("strips directives including multiline-looking metadata", () => {
    const content = "{title: Foo}\n{key: G}\n{c: Softly}\nLyrics here\n{comment: aside}";
    assert.equal(stripChordProForSearch(content), "lyrics here");
  });

  it("returns empty string for directives-only content", () => {
    assert.equal(stripChordProForSearch("{title: Only}\n{key: C}\n{start_of_verse}\n{end_of_verse}"), "");
  });

  it("returns empty string for blank input", () => {
    assert.equal(stripChordProForSearch(""), "");
    assert.equal(stripChordProForSearch("   \n\t  "), "");
  });
});

describe("normalizeLyricQuery", () => {
  it("lowercases and collapses whitespace", () => {
    assert.equal(normalizeLyricQuery("  Pois   Só  Tu  "), "pois só tu");
  });

  it("trims to empty for whitespace-only", () => {
    assert.equal(normalizeLyricQuery("   \n  "), "");
  });
});

describe("lyricsMatchQuery", () => {
  it("matches plain query against chorded lyrics", () => {
    const content =
      "{title: Exemplo}\n\nPois [D9]só Tu és o [C#m]Deus eterno,\n[Bm7]digno de [E]louvor";
    assert.equal(lyricsMatchQuery(content, "Pois só Tu és o Deus eterno"), true);
  });

  it("does not match unrelated lyrics", () => {
    assert.equal(lyricsMatchQuery("[G]Hello world", "Pois só Tu és o Deus eterno"), false);
  });

  it("returns false for empty or whitespace-only queries", () => {
    assert.equal(lyricsMatchQuery("[G]Hello world", ""), false);
    assert.equal(lyricsMatchQuery("[G]Hello world", "   "), false);
  });

  it("does not match when content is directives-only", () => {
    assert.equal(lyricsMatchQuery("{title: Song}\n{key: G}", "Song"), false);
  });

  it("matches when query has irregular whitespace", () => {
    assert.equal(lyricsMatchQuery("[C]Grace  amazing", "  Grace   amazing  "), true);
  });
});
