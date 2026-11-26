// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { lintChordPro } from "../src/parser/linter";

describe("ChordPro linter", () => {
  it("reports malformed brackets", () => {
    const diagnostics = lintChordPro("[C Lyrics\n[G]text");
    assert.ok(diagnostics.some((d) => d.code === "unclosed-bracket"));
  });

  it("reports structural block errors", () => {
    const diagnostics = lintChordPro("{end_of_verse}\n{start_of_chorus}\ntext");
    assert.ok(diagnostics.some((d) => d.code === "unmatched-block-end"));
    assert.ok(diagnostics.some((d) => d.code.includes("unclosed")));
  });

  it("accepts valid annotations and chords", () => {
    const diagnostics = lintChordPro("{start_of_verse}\n[Cmaj7]Hello\n{end_of_verse}");
    assert.equal(diagnostics.length, 0);
  });
});

describe("ChordPro linter — chorus recall / tags", () => {
  it("warns when {chorus} has no previous chorus", () => {
    const d = lintChordPro("{start_of_verse}\nHi\n{end_of_verse}\n{chorus}");
    assert.ok(d.some((x) => x.code === "chorus-recall-without-chorus"));
  });

  it("accepts {chorus} after a chorus block", () => {
    const d = lintChordPro("{start_of_chorus}\n[G]Hi\n{end_of_chorus}\n{chorus}");
    assert.equal(d.length, 0);
  });

  it("warns on empty key_note / tags", () => {
    const d = lintChordPro("{key_note}\n{tags: }\n{key_note: D}");
    assert.equal(d.filter((x) => x.code === "empty-directive-value").length, 2);
  });
});

describe("ChordPro linter — capo / keyshift validation", () => {
  it("warns on capo out of range (12)", () => {
    const d = lintChordPro("{capo: 12}");
    assert.ok(d.some((x) => x.code === "invalid-capo-range"));
  });

  it("accepts capo 0", () => {
    const d = lintChordPro("{capo: 0}");
    assert.ok(!d.some((x) => x.code === "invalid-capo-range"));
  });

  it("accepts capo 11", () => {
    const d = lintChordPro("{capo: 11}");
    assert.ok(!d.some((x) => x.code === "invalid-capo-range"));
  });

  it("warns on non-integer capo", () => {
    const d = lintChordPro("{capo: 2.5}");
    assert.ok(d.some((x) => x.code === "invalid-capo-range"));
  });

  it("warns on non-integer keyshift", () => {
    const d = lintChordPro("{keyshift: abc}");
    assert.ok(d.some((x) => x.code === "invalid-keyshift-value"));
  });

  it("accepts valid negative keyshift", () => {
    const d = lintChordPro("{keyshift: -3}");
    assert.ok(!d.some((x) => x.code === "invalid-keyshift-value"));
  });

  it("accepts key_shift alias", () => {
    const d = lintChordPro("{key_shift: 2}");
    assert.ok(!d.some((x) => x.code === "invalid-keyshift-value"));
  });

  it("warns on empty capo or keyshift", () => {
    const d = lintChordPro("{capo}\n{keyshift: }");
    assert.equal(d.filter((x) => x.code === "empty-directive-value").length, 2);
  });
});

describe("ChordPro linter — section interlocking and nesting", () => {
  it("detects interlocking section ends ({sov}...{soc}...{eov}...{eoc})", () => {
    const song = "{sov}\nlyrics\n{soc}\nddd\n{eov}\n{eoc}";
    const d = lintChordPro(song);
    const interlocked = d.find((x) => x.code === "interlocked-blocks");
    assert.ok(interlocked, "should find interlocked-blocks diagnostic");
    assert.equal(interlocked.severity, "error");
    assert.equal(interlocked.line, 4);

    const nested = d.find((x) => x.code === "nested-section");
    assert.ok(nested, "should warn on nested section open");
    assert.equal(nested.line, 2);
  });

  it("handles user example variation with {sol} alias", () => {
    const song = "{sol}\nlyrics\n{soc}\nddd\n{eov}\n{eoc}";
    const d = lintChordPro(song);
    assert.ok(d.some((x) => x.code === "mismatched-block-end" || x.code === "unmatched-block-end"));
  });

  it("detects interlocking with {sol} and {eol}", () => {
    const song = "{sol}\nlyrics\n{soc}\nddd\n{eol}\n{eoc}";
    const d = lintChordPro(song);
    const interlocked = d.find((x) => x.code === "interlocked-blocks");
    assert.ok(interlocked);
    assert.equal(interlocked.severity, "error");
    assert.equal(interlocked.line, 4);
  });

  it("detects reversed interlocking ({soc}...{sov}...{eoc}...{eov})", () => {
    const song = "{soc}\nchorus\n{sov}\nverse\n{eoc}\n{eov}";
    const d = lintChordPro(song);
    const interlocked = d.find((x) => x.code === "interlocked-blocks");
    assert.ok(interlocked);
    assert.equal(interlocked.severity, "error");
    assert.equal(interlocked.line, 4);
  });

  it("accepts sequential non-interlocking sections", () => {
    const song = "{sov}\nVerse line\n{eov}\n{soc}\nChorus line\n{eoc}";
    const d = lintChordPro(song);
    assert.equal(d.filter((x) => x.code.includes("block") || x.code.includes("section")).length, 0);
  });

  it("detects interlocking custom blocks (grid and tab)", () => {
    const song = "{start_of_grid}\n| C |\n{start_of_tab}\n---\n{end_of_grid}\n{end_of_tab}";
    const d = lintChordPro(song);
    assert.ok(d.some((x) => x.code === "interlocked-blocks"));
  });

  it("reports unclosed blocks at EOF", () => {
    const song = "{start_of_verse}\nLyrics without end";
    const d = lintChordPro(song);
    const unclosed = d.find((x) => x.code === "unclosed-block");
    assert.ok(unclosed);
    assert.equal(unclosed.line, 0);
  });
});

describe("ChordPro linter — metadata directives validation", () => {
  it("validates text directives (non-empty)", () => {
    const invalidSong =
      "{title: }\n{subtitle}\n{artist:    }\n{composer:}\n{lyricist: }\n{album:}\n{copyright: }\n{song_number: }";
    const d = lintChordPro(invalidSong);
    const emptyCount = d.filter((x) => x.code === "empty-directive-value").length;
    assert.equal(emptyCount, 8);
  });

  it("accepts valid text directives", () => {
    const validSong =
      "{title: Amazing Grace}\n{subtitle: Traditional}\n{artist: John Newton}\n{composer: John Newton}\n{lyricist: John Newton}\n{album: Hymns}\n{copyright: Public Domain}\n{song_number: 101}\n[G]Amazing";
    const d = lintChordPro(validSong);
    assert.equal(d.length, 0);
  });

  it("warns when colon separator is missing from known metadata directive", () => {
    const song = "{title Amazing Grace}\n{tempo 120}";
    const d = lintChordPro(song);
    assert.equal(d.filter((x) => x.code === "missing-colon-separator").length, 2);
  });

  it("validates tempo BPM", () => {
    assert.ok(lintChordPro("{tempo: 120}").length === 0);
    assert.ok(lintChordPro("{tempo: 75.5}").length === 0);
    assert.ok(lintChordPro("{tempo: fast}").some((x) => x.code === "non-numeric-value"));
    assert.ok(lintChordPro("{tempo: -50}").some((x) => x.code === "non-numeric-value"));
    assert.ok(lintChordPro("{tempo: 10}").some((x) => x.code === "invalid-tempo-range"));
    assert.ok(lintChordPro("{tempo: 500}").some((x) => x.code === "invalid-tempo-range"));
    assert.ok(lintChordPro("{tempo: }").some((x) => x.code === "empty-directive-value"));
  });

  it("validates time signature", () => {
    assert.ok(lintChordPro("{time: 4/4}").length === 0);
    assert.ok(lintChordPro("{time: 6/8}").length === 0);
    assert.ok(lintChordPro("{time: 3/4}").length === 0);
    assert.ok(lintChordPro("{time: 12/8}").length === 0);
    assert.ok(lintChordPro("{time: C}").length === 0);
    assert.ok(lintChordPro("{time_signature: 2/2}").length === 0);

    assert.ok(lintChordPro("{time: 4/5}").some((x) => x.code === "invalid-time-signature"));
    assert.ok(lintChordPro("{time: 0/4}").some((x) => x.code === "invalid-time-signature"));
    assert.ok(lintChordPro("{time: 4}").some((x) => x.code === "invalid-time-signature"));
    assert.ok(lintChordPro("{time: abc}").some((x) => x.code === "invalid-time-signature"));
    assert.ok(lintChordPro("{time: }").some((x) => x.code === "empty-directive-value"));
  });

  it("validates musical key notation", () => {
    assert.ok(lintChordPro("{key: C}").length === 0);
    assert.ok(lintChordPro("{key: G}").length === 0);
    assert.ok(lintChordPro("{key: F#}").length === 0);
    assert.ok(lintChordPro("{key: Bb}").length === 0);
    assert.ok(lintChordPro("{key: Am}").length === 0);
    assert.ok(lintChordPro("{key: C#m}").length === 0);
    assert.ok(lintChordPro("{key: Eb minor}").length === 0);
    assert.ok(lintChordPro("{key: Sol menor}").length === 0);
    assert.ok(lintChordPro("{key: Dó}").length === 0);
    assert.ok(lintChordPro("{original_key: F#m}").length === 0);

    assert.ok(lintChordPro("{key: H}").some((x) => x.code === "invalid-key"));
    assert.ok(lintChordPro("{key: 123}").some((x) => x.code === "invalid-key"));
    assert.ok(lintChordPro("{key: Cmaj7}").some((x) => x.code === "invalid-key"));
    assert.ok(lintChordPro("{key: C/G}").some((x) => x.code === "invalid-key"));
    assert.ok(lintChordPro("{key: }").some((x) => x.code === "empty-directive-value"));
  });

  it("validates year", () => {
    assert.ok(lintChordPro("{year: 2024}").length === 0);
    assert.ok(lintChordPro("{year: 1985}").length === 0);
    assert.ok(lintChordPro("{year: 24}").some((x) => x.code === "invalid-year"));
    assert.ok(lintChordPro("{year: 99999}").some((x) => x.code === "invalid-year"));
    assert.ok(lintChordPro("{year: abc}").some((x) => x.code === "invalid-year"));
    assert.ok(lintChordPro("{year: }").some((x) => x.code === "empty-directive-value"));
  });

  it("validates duration", () => {
    assert.ok(lintChordPro("{duration: 3:45}").length === 0);
    assert.ok(lintChordPro("{duration: 03:45}").length === 0);
    assert.ok(lintChordPro("{duration: 1:02:30}").length === 0);
    assert.ok(lintChordPro("{duration: 225}").length === 0);

    assert.ok(lintChordPro("{duration: 3:99}").some((x) => x.code === "invalid-duration"));
    assert.ok(lintChordPro("{duration: abc}").some((x) => x.code === "invalid-duration"));
    assert.ok(lintChordPro("{duration: }").some((x) => x.code === "empty-directive-value"));
  });

  it("validates youtube ID and URLs", () => {
    assert.ok(lintChordPro("{youtube: dQw4w9WgXcQ}").length === 0);
    assert.ok(lintChordPro("{youtube: https://www.youtube.com/watch?v=dQw4w9WgXcQ}").length === 0);
    assert.ok(lintChordPro("{youtube: https://youtu.be/dQw4w9WgXcQ}").length === 0);
    assert.ok(
      lintChordPro("{youtube: https://music.youtube.com/watch?v=dQw4w9WgXcQ}").length === 0,
    );

    assert.ok(
      lintChordPro("{youtube: not-a-video-id}").some((x) => x.code === "invalid-youtube-value"),
    );
    assert.ok(
      lintChordPro("{youtube: https://vimeo.com/12345}").some(
        (x) => x.code === "invalid-youtube-value",
      ),
    );
    assert.ok(lintChordPro("{youtube: }").some((x) => x.code === "empty-directive-value"));
  });

  it("validates ccli numbers", () => {
    assert.ok(lintChordPro("{ccli: 1234567}").length === 0);
    assert.ok(lintChordPro("{ccli: abc}").some((x) => x.code === "invalid-ccli-number"));
    assert.ok(lintChordPro("{ccli: }").some((x) => x.code === "empty-directive-value"));
  });

  it("validates comments and repeat", () => {
    assert.ok(lintChordPro("{comment: Watch transition|warning}").length === 0);
    assert.ok(lintChordPro("{c: |warning}").some((x) => x.code === "empty-directive-value"));
    assert.ok(lintChordPro("{comment: }").some((x) => x.code === "empty-directive-value"));

    assert.ok(lintChordPro("{repeat: 2}").length === 0);
    assert.ok(lintChordPro("{repeat: 3x}").length === 0);
    assert.ok(lintChordPro("{repeat: 0}").some((x) => x.code === "invalid-repeat-value"));
    assert.ok(lintChordPro("{repeat: abc}").some((x) => x.code === "invalid-repeat-value"));
  });

  it("validates styling font size and colors", () => {
    assert.ok(lintChordPro("{textsize: 14}").length === 0);
    assert.ok(lintChordPro("{chordsize: 12pt}").length === 0);
    assert.ok(lintChordPro("{textsize: abc}").some((x) => x.code === "invalid-size-value"));

    assert.ok(lintChordPro("{textcolor: #ff0000}").length === 0);
    assert.ok(lintChordPro("{chordcolor: blue}").length === 0);
    assert.ok(lintChordPro("{textcolor: 12345}").some((x) => x.code === "invalid-color-value"));
  });
});

describe("ChordPro linter — exact range diagnostics", () => {
  it("positions range exactly on invalid value token", () => {
    const line = "{tempo: -50}";
    const d = lintChordPro(line);
    const diag = d.find((x) => x.code === "non-numeric-value");
    assert.ok(diag);
    assert.equal(line.slice(diag.column, diag.endColumn), "-50");
  });

  it("positions range on out-of-range tempo", () => {
    const line = "  {tempo: 500}  ";
    const d = lintChordPro(line);
    const diag = d.find((x) => x.code === "invalid-tempo-range");
    assert.ok(diag);
    assert.equal(line.slice(diag.column, diag.endColumn), "500");
  });

  it("positions range on empty directive line", () => {
    const line = "  {title: }  ";
    const d = lintChordPro(line);
    const diag = d.find((x) => x.code === "empty-directive-value");
    assert.ok(diag);
    assert.equal(line.slice(diag.column, diag.endColumn), "{title: }");
  });
});

describe("ChordPro linter — localization", () => {
  it("produces Portuguese messages by default or when language='pt'", () => {
    const d = lintChordPro("{time: 4/5}", { language: "pt" });
    assert.ok(d[0].message.includes("Formato de compasso inválido"));
  });

  it("produces English messages when language='en'", () => {
    const d = lintChordPro("{time: 4/5}", { language: "en" });
    assert.ok(d[0].message.includes("Invalid time signature format"));

    const d2 = lintChordPro("{sov}\n{soc}\n{eov}\n{eoc}", { language: "en" });
    const interlocked = d2.find((x) => x.code === "interlocked-blocks");
    assert.ok(interlocked);
    assert.ok(interlocked.message.includes("Improperly interlocked sections"));
  });

  it("produces Spanish messages when language='es'", () => {
    const d = lintChordPro("{time: 4/5}", { language: "es" });
    assert.ok(d[0].message.includes("Formato de compás no válido"));

    const d2 = lintChordPro("{sov}\n{soc}\n{eov}\n{eoc}", { language: "es" });
    const interlocked = d2.find((x) => x.code === "interlocked-blocks");
    assert.ok(interlocked);
    assert.ok(interlocked.message.includes("Secciones entrelazadas incorrectamente"));
  });
});
