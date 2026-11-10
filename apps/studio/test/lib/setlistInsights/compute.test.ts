/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  computeSetlistInsights,
  daysBetween,
  type SetlistServiceInput,
  type SetlistSongInput,
} from "../../../src/lib/setlistInsights/compute";

const songs: SetlistSongInput[] = [
  { id: "a", title: "Amazing Grace", artist: "Traditional" },
  { id: "b", title: "Oceans", artist: "Hillsong" },
  { id: "c", title: "Never Played", artist: "Demo" },
];

const services: SetlistServiceInput[] = [
  {
    id: "past-1",
    name: "Sunday Past",
    date: "2026-01-01",
    elements: [{ type: "song", songId: "a" }, { type: "song", songId: "a" }, { type: "welcome" }],
  },
  {
    id: "past-2",
    name: "Midweek",
    date: "2026-02-01",
    elements: [
      { type: "song", songId: "a" },
      { type: "song", songId: "b" },
    ],
  },
  {
    id: "upcoming",
    name: "Next Sunday",
    date: "2026-04-01",
    elements: [{ type: "song", songId: "b" }],
  },
  {
    id: "archived",
    name: "Old Special",
    date: "2025-12-01",
    archived: true,
    elements: [{ type: "song", songId: "b" }],
  },
];

test("daysBetween returns whole calendar days", () => {
  assert.equal(daysBetween("2026-01-01", "2026-01-01"), 0);
  assert.equal(daysBetween("2026-01-01", "2026-01-02"), 1);
  assert.equal(daysBetween("2026-01-31", "2026-02-01"), 1);
  assert.equal(daysBetween("2026-03-01", "2026-01-01"), -59);
});

test("computeSetlistInsights splits past vs upcoming and tracks never played", () => {
  const summary = computeSetlistInsights(songs, services, {
    today: "2026-03-01",
    staleAfterDays: 28,
    highlightLimit: 10,
    recentDays: 14,
  });

  assert.equal(summary.serviceCount, 4);
  assert.equal(summary.pastServiceCount, 3);
  assert.equal(summary.upcomingServiceCount, 1);
  assert.equal(summary.songsTracked, 3);
  assert.equal(summary.songsPlayed, 2);
  assert.equal(summary.songsNeverPlayed, 1);

  const never = summary.neverPlayed.find((s) => s.songId === "c");
  assert.ok(never);
  assert.equal(never.playCount, 0);
  assert.equal(never.lastPlayed, null);
  assert.equal(never.daysSinceLastPlayed, null);

  const a = summary.songs.find((s) => s.songId === "a")!;
  assert.equal(a.playCount, 2);
  assert.equal(a.appearanceCount, 3); // two elements in past-1 + one in past-2
  assert.equal(a.lastPlayed, "2026-02-01");
  assert.equal(a.lastServiceName, "Midweek");
  assert.equal(a.daysSinceLastPlayed, daysBetween("2026-02-01", "2026-03-01"));
  assert.equal(a.upcomingCount, 0);

  const b = summary.songs.find((s) => s.songId === "b")!;
  assert.equal(b.playCount, 2); // past-2 + archived
  assert.equal(b.upcomingCount, 1);
  assert.equal(b.lastPlayed, "2026-02-01");
});

test("computeSetlistInsights flags overdue songs past staleAfterDays", () => {
  const summary = computeSetlistInsights(songs, services, {
    today: "2026-03-15",
    staleAfterDays: 28,
  });

  assert.ok(summary.overdue.some((s) => s.songId === "a"));
  assert.ok(summary.overdue.every((s) => (s.daysSinceLastPlayed ?? 0) >= 28));
  assert.ok(!summary.neverPlayed.some((s) => s.songId === "a"));
});

test("computeSetlistInsights handles empty inputs", () => {
  const summary = computeSetlistInsights([], [], { today: "2026-03-01" });
  assert.equal(summary.songsTracked, 0);
  assert.equal(summary.averagePlaysPerSong, 0);
  assert.equal(summary.totalPlays, 0);
  assert.deepEqual(summary.mostPlayed, []);
});
