import { lyricsMatchQuery, normalizeLyricQuery } from "../../lib/lyricSearch.js";

export type DuplicateSongRow = {
  id: string;
  title: string;
  artist: string;
  content: string;
};

export type DuplicatePair = {
  a: { id: string; title: string; artist: string };
  b: { id: string; title: string; artist: string };
  score: number;
  reasons: Array<"title" | "lyrics">;
};

function normalizeTitle(title: string): string {
  return title
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Lightweight lyric fingerprint: first ~80 normalized alphanumeric chars of lyrics. */
function lyricFingerprint(content: string): string {
  const plain = content
    .replace(/\{[^}]*\}/g, " ")
    .replace(/\[[^\]]*]/g, " ")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.slice(0, 80);
}

function titleSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.85;
  const ta = new Set(a.split(" ").filter((w) => w.length > 2));
  const tb = new Set(b.split(" ").filter((w) => w.length > 2));
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const w of ta) if (tb.has(w)) inter++;
  return inter / Math.max(ta.size, tb.size);
}

/**
 * Read-only duplicate detection by normalized title + lyric fingerprint.
 * Caps comparisons for large libraries.
 */
export function findSongDuplicates(
  songs: DuplicateSongRow[],
  opts?: { minScore?: number; limit?: number },
): { pairs: DuplicatePair[]; scanned: number } {
  const minScore = opts?.minScore ?? 0.72;
  const limit = opts?.limit ?? 50;
  const prepared = songs.map((s) => ({
    ...s,
    titleNorm: normalizeTitle(s.title),
    fp: lyricFingerprint(s.content),
  }));

  const pairs: DuplicatePair[] = [];
  const maxN = Math.min(prepared.length, 400);
  for (let i = 0; i < maxN; i++) {
    for (let j = i + 1; j < maxN; j++) {
      const a = prepared[i]!;
      const b = prepared[j]!;
      const reasons: Array<"title" | "lyrics"> = [];
      let score = 0;

      const tSim = titleSimilarity(a.titleNorm, b.titleNorm);
      if (tSim >= 0.72) {
        reasons.push("title");
        score = Math.max(score, tSim);
      }

      if (a.fp.length >= 24 && b.fp.length >= 24) {
        if (a.fp === b.fp || a.fp.includes(b.fp.slice(0, 40)) || b.fp.includes(a.fp.slice(0, 40))) {
          reasons.push("lyrics");
          score = Math.max(score, 0.9);
        } else if (
          lyricsMatchQuery(a.content, normalizeLyricQuery(b.title)) ||
          lyricsMatchQuery(b.content, normalizeLyricQuery(a.title))
        ) {
          // weak signal only if titles already similar
          if (tSim >= 0.5) {
            reasons.push("lyrics");
            score = Math.max(score, 0.75);
          }
        }
      }

      if (reasons.length && score >= minScore) {
        pairs.push({
          a: { id: a.id, title: a.title, artist: a.artist },
          b: { id: b.id, title: b.title, artist: b.artist },
          score: Math.round(score * 100) / 100,
          reasons,
        });
      }
      if (pairs.length >= limit) {
        return { pairs, scanned: maxN };
      }
    }
  }

  pairs.sort((x, y) => y.score - x.score);
  return { pairs, scanned: maxN };
}
