import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  guitarInstrument,
  instrumentRegistry,
  pianoInstrument,
  ukuleleInstrument,
} from "../src/instruments";

describe("built-in instrument fingerings", () => {
  it("resolves common open chords for guitar", () => {
    for (const chord of ["C", "G", "D", "Em", "Am", "F"]) {
      const fingering = guitarInstrument.getFingering(chord);
      assert.ok(fingering, `expected guitar fingering for ${chord}`);
      assert.equal(fingering.chord, chord);
      assert.ok(fingering.shape);
    }
    assert.equal(guitarInstrument.getFingering("NotAChord"), null);
  });

  it("resolves piano and ukulele fingerings for shared chords", () => {
    const piano = pianoInstrument.getFingering("C");
    const uke = ukuleleInstrument.getFingering("C");
    assert.ok(piano);
    assert.ok(uke);
    assert.equal(piano.chord, "C");
    assert.equal(uke.chord, "C");
  });

  it("keeps registry ids stable for consumers", () => {
    assert.equal(instrumentRegistry.get("guitar")?.id, "guitar");
    const piano = instrumentRegistry.get("piano");
    assert.ok(piano);
    assert.ok(piano.displayName.length > 0);
    assert.equal(instrumentRegistry.has("ukulele"), true);
    assert.equal(instrumentRegistry.has("mandolin"), false);
  });
});
