/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  convertSongbookCommentSections,
  songbookKeyToChordPro,
} from "../../../src/lib/import/songbook";

describe("songbook import", () => {
  it("maps SongbookPro key codes to ChordPro keys", () => {
    assert.equal(songbookKeyToChordPro(0), "C");
    assert.equal(songbookKeyToChordPro(5), "F");
    assert.equal(songbookKeyToChordPro(10), "Bb");
    assert.equal(songbookKeyToChordPro(21), "Am");
    assert.equal(songbookKeyToChordPro(22), "Bbm");
    assert.equal(songbookKeyToChordPro(null), null);
  });

  it("converts SongbookPro {c:} labels into section environments", () => {
    const converted = convertSongbookCommentSections(`{c: Verse1}
Line one

{c: Chorus}
Refrain

{c: Bridge}
Bridge line

{c: Intro}
{sot}
tab
{eot}
`);
    assert.match(converted, /\{start_of_verse:\s*Verse1\}/);
    assert.match(converted, /\{end_of_verse\}/);
    assert.match(converted, /\{start_of_chorus:\s*Chorus\}/);
    assert.match(converted, /\{start_of_bridge:\s*Bridge\}/);
    assert.match(converted, /\{start_of_part:\s*Intro\}/);
    assert.match(converted, /\{start_of_tab\}/);
    assert.match(converted, /\{end_of_tab\}/);
  });
});
