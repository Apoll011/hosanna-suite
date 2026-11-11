import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ChordFinder } from "../src/editor/ChordFinder";
import {
  filterOutDirectiveLocals,
  isDirectiveCompletionWord,
} from "../src/editor/directiveCompletions";

describe("editor helpers", () => {
  it("extracts and ranks repeated chord completions", () => {
    assert.deepEqual(ChordFinder.getChords("[C]one [G]two [C]three"), [
      { value: "[C]", meta: "2 occurrences", score: 2 },
      { value: "[G]", meta: "1 occurrence", score: 1 },
    ]);
  });

  it("returns no completions for lyric-only text", () => {
    assert.deepEqual(ChordFinder.getChords("Amazing grace"), []);
    assert.deepEqual(ChordFinder.getChords(null as unknown as string), []);
  });

  it("treats start/end_of_* and known directives as directive words", () => {
    assert.equal(isDirectiveCompletionWord("start_of_verse"), true);
    assert.equal(isDirectiveCompletionWord("{start_of_verse}"), true);
    assert.equal(isDirectiveCompletionWord("sov"), true);
    assert.equal(isDirectiveCompletionWord("title"), true);
    assert.equal(isDirectiveCompletionWord("Amazing"), false);
    assert.equal(isDirectiveCompletionWord("t"), false); // 1-char alias kept for lyrics
  });

  it("filters directive names out of local Ace completions", () => {
    assert.deepEqual(
      filterOutDirectiveLocals([
        { value: "start_of_verse", meta: "local" },
        { value: "grace", meta: "local" },
        { value: "sov", meta: "local" },
      ]),
      [{ value: "grace", meta: "local" }],
    );
  });
});
