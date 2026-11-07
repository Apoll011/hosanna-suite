import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  convertToChordProDetailed,
  detectSourceFormat,
  toChordPro,
} from "../src/parser/txt-to-chordpro";

describe("text-to-ChordPro conversions (extra)", () => {
  it("converts Ultimate Guitar sheets with section headers", () => {
    const input = `[Verse 1]
C               G
Amazing grace how sweet the sound
[Chorus]
F               C
That saved a wretch like me`;
    assert.equal(detectSourceFormat(input), "ultimate-guitar");
    const result = convertToChordProDetailed(input);
    assert.equal(result.detectedSource, "ultimate-guitar");
    assert.match(result.chordpro, /\{start_of_verse/);
    assert.match(result.chordpro, /\{start_of_chorus/);
    assert.match(result.chordpro, /\[C\]/);
    assert.match(result.chordpro, /Amazing grace/);
  });

  it("converts CifraClub sheets and dehyphenates syllables", () => {
    const input = `Tom: G
Intérprete: Banda Hosanna
[Intro]
G   D
[Refrão]
G           D
Deus-que-tomou-meu-lugar`;
    assert.equal(detectSourceFormat(input), "cifraclub");
    const result = convertToChordProDetailed(input);
    assert.equal(result.detectedSource, "cifraclub");
    assert.match(result.chordpro, /\{key:\s*G\}/i);
    assert.match(result.chordpro, /\{artist:\s*Banda Hosanna\}/i);
    assert.match(result.chordpro, /Deus que tom/);
    assert.match(result.chordpro, /\[G\]/);
    assert.match(result.chordpro, /\[D\]/);
  });

  it("honors forced source and keeps repeat markers", () => {
    const input = `C     G
Hello world x2`;
    const forced = convertToChordProDetailed(input, { source: "plain" });
    assert.equal(forced.detectedSource, "plain");
    assert.match(toChordPro(input), /\[C\]/);
    assert.match(forced.chordpro, /x2|2x/);
  });

  it("can disable section detection", () => {
    const input = `[Verse]
C   G
Hello`;
    const result = convertToChordProDetailed(input, {
      source: "ultimate-guitar",
      detectSections: false,
    });
    assert.doesNotMatch(result.chordpro, /\{start_of_verse/);
    assert.match(result.chordpro, /\[C\]/);
  });
});
