import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveChords, parseCapoValue, parseKeyShiftValue } from "../src/parser/resolveChords";
import "../src/instruments";
import fixtures from "./fixtures/resolve-chords.json" with { type: "json" };

type Fixture = {
  id: string;
  description: string;
  input: { chords: string[]; key: string; keyShift: number; capo: number; instrument: string };
  expected: { shownKey: string; shownChords: string[]; capoLabel: string | null };
};

describe("resolveChords — fixture suite", () => {
  for (const f of fixtures as Fixture[]) {
    it(f.description, () => {
      const result = resolveChords(f.input);
      assert.equal(result.shownKey, f.expected.shownKey, `shownKey mismatch for ${f.id}`);
      assert.deepEqual(result.shownChords, f.expected.shownChords, `shownChords mismatch for ${f.id}`);
      assert.equal(result.capoLabel, f.expected.capoLabel, `capoLabel mismatch for ${f.id}`);
    });
  }
});

describe("parseCapoValue", () => {
  it("returns valid values in range 0–11", () => {
    assert.equal(parseCapoValue("4"), 4);
    assert.equal(parseCapoValue(0), 0);
    assert.equal(parseCapoValue("11"), 11);
  });

  it("clamps out-of-range to 0", () => {
    assert.equal(parseCapoValue("12"), 0);
    assert.equal(parseCapoValue("-1"), 0);
  });

  it("returns 0 for non-integer or invalid input", () => {
    assert.equal(parseCapoValue("abc"), 0);
    assert.equal(parseCapoValue(undefined), 0);
    assert.equal(parseCapoValue("3.5"), 0);
    assert.equal(parseCapoValue(""), 0);
  });
});

describe("parseKeyShiftValue", () => {
  it("returns valid signed integers", () => {
    assert.equal(parseKeyShiftValue("2"), 2);
    assert.equal(parseKeyShiftValue("-3"), -3);
    assert.equal(parseKeyShiftValue(0), 0);
  });

  it("returns 0 for non-integer or invalid input", () => {
    assert.equal(parseKeyShiftValue("abc"), 0);
    assert.equal(parseKeyShiftValue(undefined), 0);
    assert.equal(parseKeyShiftValue("2.5"), 0);
    assert.equal(parseKeyShiftValue(""), 0);
  });
});
