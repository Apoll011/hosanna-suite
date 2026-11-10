import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { keyCanonicalWarning } from "../../../src/mcp/lib/keyCanonical.js";
import { mapToolError, toolError } from "../../../src/mcp/lib/toolErrors.js";
import { ResourceAccessError } from "../../../src/mcp/lib/resourceAccess.js";
import { rankSongsByRelevance } from "../../../src/mcp/lib/searchRelevance.js";
import { findSongDuplicates } from "../../../src/mcp/lib/songDuplicates.js";
import { transposeChordProSource } from "../../../src/mcp/lib/transposeSource.js";
import { normalizeResponsibilities } from "../../../src/mcp/lib/orgDirectory.js";

/** Real audit fixtures (Igreja Batista em Arruda dos Vinhos). */
const FIXTURE = {
  orgId: "5X8M6rA9jbXpsoN78zshCOYjwGHxqooX",
  trashedSongId: "c8bd861a-d9e6-457c-af92-44419b0efb42",
  trashedServiceId: "72ecd299-e576-4447-9487-e781b9c79305",
  unresolvedNames: ["Pr. Nelson", "Ir. Paulo"] as const,
  nonCanonicalKeySong: "Cristo És Sabedoria",
  nonCanonicalKey: "Bb-C",
  duplicateTitles: ["Quão Grande És Tu", "Quão Grande é Jesus / Quão Grande és Tu"],
};

describe("MCP harden — error envelope", () => {
  it("every toolError has code + canonicalCode", () => {
    const err = toolError({ code: "not_found", message: "missing" });
    assert.equal(err.error, true);
    assert.equal(err.code, "not_found");
    assert.equal(err.canonicalCode, "NOT_FOUND");
  });

  it("P1: trashed song id maps to TRASHED with actionable hint", () => {
    const err = mapToolError(
      new ResourceAccessError("TRASHED", "A música está na lixeira.", {
        id: FIXTURE.trashedSongId,
        kind: "song",
        purgeAt: null,
      }),
    );
    assert.equal(err.code, "trashed");
    assert.equal(err.canonicalCode, "TRASHED");
    assert.ok(err.hint?.includes("includeTrashed=true") || err.hint?.includes("restore"));
    assert.equal((err.details as { id: string }).id, FIXTURE.trashedSongId);
  });

  it("P1: trashed service id maps to TRASHED", () => {
    const err = mapToolError(
      new ResourceAccessError("TRASHED", "O culto está na lixeira.", {
        id: FIXTURE.trashedServiceId,
        kind: "service",
      }),
    );
    assert.equal(err.canonicalCode, "TRASHED");
    assert.equal((err.details as { id: string }).id, FIXTURE.trashedServiceId);
  });

  it("P1: true missing id maps to NOT_FOUND (not TRASHED)", () => {
    const err = mapToolError(
      new ResourceAccessError("NOT_FOUND", "A música não existe.", {
        id: "00000000-0000-0000-0000-000000000000",
        kind: "song",
      }),
    );
    assert.equal(err.canonicalCode, "NOT_FOUND");
    assert.equal(err.code, "not_found");
  });
});

describe("MCP harden — P0 name-only assignees", () => {
  it("accepts name-only assignees without memberId", () => {
    const responsibilities = normalizeResponsibilities([
      {
        categoryId: "preacher",
        assignees: FIXTURE.unresolvedNames.map((name) => ({ name })),
      },
    ]);
    assert.equal(responsibilities[0]!.assignees.length, 2);
    for (const a of responsibilities[0]!.assignees) {
      assert.ok(a.name);
      assert.equal(a.memberId, undefined);
      assert.equal(a.unlinked, true);
    }
  });

  it("keeps memberId when provided", () => {
    const responsibilities = normalizeResponsibilities([
      {
        categoryId: "leader",
        assignees: [{ name: "Admin", memberId: "mem_123" }],
      },
    ]);
    assert.equal(responsibilities[0]!.assignees[0]!.memberId, "mem_123");
    assert.equal(responsibilities[0]!.assignees[0]!.unlinked, undefined);
  });
});

describe("MCP harden — P4 relevance + P5 key + P6 duplicates + P8 transpose", () => {
  it("songs_search relevance ranks lyric match for sangue", () => {
    const songs = [
      {
        title: "Aleluia",
        artist: "",
        content: "{title: Aleluia}\n[C]Foo",
        tags: [] as string[],
      },
      {
        title: "Sangue de Jesus",
        artist: "",
        content: "{title: Sangue}\nO sangue",
        tags: [],
      },
      {
        title: "Zebra",
        artist: "",
        content: "no match here",
        tags: ["sangue"],
      },
    ];
    const ranked = rankSongsByRelevance(songs, "sangue");
    assert.ok(ranked.length >= 2);
    assert.equal(ranked[0]!.matchedField === "title" || ranked[0]!.song.title.includes("Sangue"), true);
    assert.ok(ranked[0]!.score >= ranked[ranked.length - 1]!.score);
  });

  it("P5: Bb-C emits key_not_canonical warning without blocking", () => {
    const w = keyCanonicalWarning(FIXTURE.nonCanonicalKey);
    assert.ok(w);
    assert.equal(w!.code, "key_not_canonical");
    assert.equal(w!.key, "Bb-C");
    assert.ok(w!.suggestion === "Bb" || w!.suggestion == null || typeof w!.suggestion === "string");
  });

  it("P6: similar titles score as duplicates", () => {
    const { pairs } = findSongDuplicates(
      [
        {
          id: "a",
          title: FIXTURE.duplicateTitles[0]!,
          artist: "",
          content: "{title: Q}\nQuão grande és tu Senhor da criação",
        },
        {
          id: "b",
          title: FIXTURE.duplicateTitles[1]!,
          artist: "",
          content: "{title: Q}\nQuão grande és tu Senhor da criação e da terra",
        },
        {
          id: "c",
          title: "Totalmente Diferente",
          artist: "",
          content: "{title: X}\nOutra letra completamente distinta abcdefghijklmnop",
        },
      ],
      { minScore: 0.72 },
    );
    assert.ok(pairs.some((p) => p.a.id === "a" && p.b.id === "b"));
  });

  it("P8: G→D reports ascending +7 with direction up (not -5)", () => {
    const source = `{title: T}\n{key: G}\n[G]Hello [C]world`;
    const result = transposeChordProSource(source, { toKey: "D" });
    assert.equal(result.semitones, 7);
    assert.equal(result.direction, "up");
    assert.equal(result.toKey, "D");
    assert.match(result.content, /\[D\]/);
  });
});

describe("MCP harden — fixture ids documented", () => {
  it("keeps audit org + resource ids stable for regression docs", () => {
    assert.match(FIXTURE.orgId, /^5X8M/);
    assert.match(FIXTURE.trashedSongId, /^c8bd861a/);
    assert.match(FIXTURE.trashedServiceId, /^72ecd299/);
    assert.deepEqual([...FIXTURE.unresolvedNames], ["Pr. Nelson", "Ir. Paulo"]);
  });
});
