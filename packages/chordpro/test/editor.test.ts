// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ChordFinder } from "../src/editor/ChordFinder";
import {
  createChordCompletionCache,
  createChordCompleter,
  isInsideChordBracket,
} from "../src/editor/chordCompletions";
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

  it("only offers chord completions while the cursor is inside a chord bracket", () => {
    const session = { getLine: () => "Amazing [C] grace [G" };
    assert.equal(isInsideChordBracket(session, { row: 0, column: 20 }), true);
    assert.equal(isInsideChordBracket(session, { row: 0, column: 13 }), false);
    assert.equal(isInsideChordBracket(null, { row: 0, column: 0 }), false);
  });

  it("skips the document scan when the cursor is outside a chord bracket", () => {
    let reads = 0;
    const session = { getLine: () => "Amazing grace", on: () => {} };
    const editor = {
      session,
      getValue: () => {
        reads += 1;
        return "[C] [G]";
      },
    };
    const completer = createChordCompleter();
    let results: unknown[] | null = null;

    completer.getCompletions(editor, session, { row: 0, column: 13 }, "g", (error, items) => {
      assert.equal(error, null);
      results = items;
    });

    assert.deepEqual(results, []);
    assert.equal(reads, 0);
  });

  it("reuses chord completions until the session revision changes", () => {
    const listeners: Array<() => void> = [];
    const session = {
      getLine: () => "[C]",
      on: (_event: "change", listener: () => void) => {
        listeners.push(listener);
      },
    };
    let value = "[C]";
    let reads = 0;
    const editor = {
      session,
      getValue: () => {
        reads += 1;
        return value;
      },
    };
    const cache = createChordCompletionCache();

    assert.deepEqual(cache.get(editor), [{ value: "[C]", meta: "1 occurrence", score: 1 }]);
    assert.deepEqual(cache.get(editor), [{ value: "[C]", meta: "1 occurrence", score: 1 }]);
    assert.equal(reads, 1);

    value = "[C] [G]";
    for (const listener of listeners) listener();

    assert.deepEqual(cache.get(editor), [
      { value: "[C]", meta: "1 occurrence", score: 1 },
      { value: "[G]", meta: "1 occurrence", score: 1 },
    ]);
    assert.equal(reads, 2);
  });
});
