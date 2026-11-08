import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { analyzeSong } from "../src/parser/analysis";
import { parseChordPro } from "../src/parser/parser";

describe("analyzeSong", () => {
  it("reports tabs, variants, and lyric length", () => {
    const song = parseChordPro(`{title: Tabs}
{start_of_tab}
e|---0---|
{end_of_tab}
{start_of_version: Live}
[Am]Live line
{end_of_version}`);

    const analysis = analyzeSong(song);
    assert.equal(analysis.hasTabs, true);
    assert.equal(analysis.hasVariants, true);
    assert.deepEqual(analysis.uniqueChords, ["Am"]);
    assert.equal(analysis.chordCount, 1);
    assert.ok(analysis.lyricsLength > 0);
  });

  it("detects a minor key from chord vocabulary", () => {
    const analysis = analyzeSong(
      parseChordPro(`{tempo: not-a-number}
{start_of_verse}
[Am]one [Dm]two [Em]three [E]four
{end_of_verse}`),
    );

    assert.equal(analysis.tempo, undefined);
    assert.equal(analysis.key, undefined);
    assert.ok(analysis.detectedKey);
    assert.equal(analysis.uniqueChords.length, 4);
    assert.equal(analysis.hasAnnotations, false);
  });

  it("includes grid and lyric chords in the unique set", () => {
    const analysis = analyzeSong(
      parseChordPro(`{start_of_grid}
| [C] | [G] |
{end_of_grid}
[Am]lyric`),
    );
    assert.ok(analysis.chordCount >= 3);
    assert.deepEqual(analysis.uniqueChords.sort(), ["Am", "C", "G"]);
    assert.equal(analysis.hasTabs, false);
  });
});
