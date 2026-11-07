/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SongScore } from "@hosanna/chordpro";
import type { Song } from "../../types";
import { getAutoFixForCriterion, listAutoFixes } from "./autoFixes/registry";

export type ScoreMissingCriterion = SongScore["missing"][number];

export const SCORE_CRITERIA: ScoreMissingCriterion[] = [
  "errors",
  "sections",
  "chords",
  "title",
  "artist",
  "key",
  "tempo",
  "songNumber",
  "youtube",
  "duration",
];

export interface LibraryHealthIssueSong {
  id: string;
  title: string;
  artist: string;
  score: number;
  /** True when a registered auto-fix can resolve this criterion for the song. */
  autoFixable: boolean;
}

export interface LibraryHealthCategory {
  criterion: ScoreMissingCriterion;
  songs: LibraryHealthIssueSong[];
  autoFixableCount: number;
}

export interface LibraryHealthSummary {
  /** Average song score across the library (0–100). Empty library → 100. */
  healthPercentage: number;
  songCount: number;
  issueCount: number;
  averageScore: number;
  healthyCount: number;
  categories: LibraryHealthCategory[];
}

function songScoreValue(song: Song): number {
  return song.score?.score ?? 0;
}

function songMissing(song: Song): ScoreMissingCriterion[] {
  if (!song.score) return [...SCORE_CRITERIA];
  return song.score.missing;
}

function toIssueSong(
  song: Song,
  criterion: ScoreMissingCriterion,
): LibraryHealthIssueSong {
  return {
    id: song.id,
    title: song.title || "Untitled",
    artist: song.artist || "",
    score: songScoreValue(song),
    autoFixable: getAutoFixForCriterion(criterion)?.canFix(song) ?? false,
  };
}

/**
 * Aggregate library quality from the existing per-song score system.
 * Also surfaces songs that auto-fixes can improve even when the score
 * already treats the criterion as satisfied (e.g. detected key without `{key:}`).
 */
export function computeLibraryHealth(songs: Song[]): LibraryHealthSummary {
  const songCount = songs.length;

  if (songCount === 0) {
    return {
      healthPercentage: 100,
      songCount: 0,
      issueCount: 0,
      averageScore: 100,
      healthyCount: 0,
      categories: [],
    };
  }

  const totalScore = songs.reduce((sum, s) => sum + songScoreValue(s), 0);
  const averageScore = totalScore / songCount;
  const healthPercentage = Math.round(averageScore);

  const byCriterion = new Map<
    ScoreMissingCriterion,
    Map<string, LibraryHealthIssueSong>
  >();

  for (const criterion of SCORE_CRITERIA) {
    byCriterion.set(criterion, new Map());
  }

  let issueCount = 0;
  let healthyCount = 0;

  for (const song of songs) {
    const missing = songMissing(song);
    if (missing.length === 0) {
      healthyCount += 1;
    } else {
      issueCount += 1;
    }

    for (const criterion of missing) {
      byCriterion.get(criterion)?.set(song.id, toIssueSong(song, criterion));
    }
  }

  // Surface latent auto-fix opportunities (e.g. fill `{key:}` from analyze()).
  for (const fixer of listAutoFixes()) {
    const bucket = byCriterion.get(fixer.criterion);
    if (!bucket) continue;
    for (const song of songs) {
      if (bucket.has(song.id)) continue;
      if (!fixer.canFix(song)) continue;
      bucket.set(song.id, toIssueSong(song, fixer.criterion));
    }
  }

  const categories: LibraryHealthCategory[] = SCORE_CRITERIA.map(
    (criterion) => {
      const songsInCategory = [
        ...(byCriterion.get(criterion)?.values() ?? []),
      ].sort(
        (a, b) =>
          Number(b.autoFixable) - Number(a.autoFixable) ||
          a.score - b.score ||
          a.title.localeCompare(b.title),
      );
      return {
        criterion,
        songs: songsInCategory,
        autoFixableCount: songsInCategory.filter((s) => s.autoFixable).length,
      };
    },
  ).filter((c) => c.songs.length > 0);

  return {
    healthPercentage,
    songCount,
    issueCount,
    averageScore,
    healthyCount,
    categories,
  };
}
