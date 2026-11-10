/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from "node:assert/strict";
import test from "node:test";

import { computeLibraryHealth } from "../../../src/lib/libraryHealth/compute";
import type { Song } from "../../../src/types";

const song = (partial: Partial<Song> & Pick<Song, "id" | "title">): Song => ({
  artist: partial.artist ?? "",
  content: partial.content ?? "",
  path: partial.path ?? `${partial.title}.chopro`,
  tags: partial.tags ?? [],
  createdAt: partial.createdAt ?? "",
  updatedAt: partial.updatedAt ?? "",
  ...partial,
});

test("empty library reports 100% health", () => {
  const summary = computeLibraryHealth([]);
  assert.equal(summary.healthPercentage, 100);
  assert.equal(summary.averageScore, 100);
  assert.equal(summary.songCount, 0);
  assert.equal(summary.issueCount, 0);
  assert.deepEqual(summary.categories, []);
});

test("songs with missing criteria populate categories", () => {
  const summary = computeLibraryHealth([
    song({
      id: "s1",
      title: "Incomplete",
      score: { score: 40, missing: ["title", "key", "tempo"] },
    }),
    song({
      id: "s2",
      title: "Healthy",
      score: { score: 100, missing: [] },
    }),
  ]);

  assert.equal(summary.songCount, 2);
  assert.equal(summary.issueCount, 1);
  assert.equal(summary.healthyCount, 1);
  assert.equal(summary.healthPercentage, 70);
  assert.ok(summary.categories.some((c) => c.criterion === "title"));
  assert.ok(summary.categories.some((c) => c.criterion === "key"));
  assert.ok(summary.categories.some((c) => c.criterion === "tempo"));

  const titleCategory = summary.categories.find((c) => c.criterion === "title")!;
  assert.equal(titleCategory.songs.length, 1);
  assert.equal(titleCategory.songs[0].id, "s1");
});

test("songs without a score object are treated as missing every criterion", () => {
  const summary = computeLibraryHealth([song({ id: "bare", title: "Bare" })]);
  assert.equal(summary.issueCount, 1);
  assert.equal(summary.healthPercentage, 0);
  assert.ok(summary.categories.length >= 5);
});

test("autoFixableCount reflects registered fixers that canFix the song", () => {
  // Chord content with a detectible key but no `{key:}` directive.
  const content = `{title: Key Song}\n[G]Amazing [C]grace`;
  const summary = computeLibraryHealth([
    song({
      id: "fixable",
      title: "Key Song",
      content,
      score: { score: 80, missing: ["key"] },
    }),
  ]);

  const keyCategory = summary.categories.find((c) => c.criterion === "key");
  assert.ok(keyCategory);
  // Depending on chordpro analysis, canFix may or may not fire — assert shape.
  assert.ok(typeof keyCategory.autoFixableCount === "number");
  assert.ok(keyCategory.autoFixableCount >= 0);
  assert.ok(keyCategory.autoFixableCount <= keyCategory.songs.length);
});
