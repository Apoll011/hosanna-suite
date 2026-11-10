import { lyricsMatchQuery, normalizeLyricQuery } from "../../lib/lyricSearch.js";

export type SongMatchField = "title" | "artist" | "lyrics" | "tag";

export type RankedSongMatch<T extends { title: string; artist: string; content: string; tags: string[] }> =
  {
    song: T;
    score: number;
    matchedField: SongMatchField;
  };

function scoreField(haystack: string, needle: string, weight: number): number {
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  if (!n) return 0;
  if (h === n) return weight * 3;
  if (h.startsWith(n)) return weight * 2;
  if (h.includes(n)) return weight;
  return 0;
}

/** Rank library songs for songs_search (title/artist/lyrics/tags). */
export function rankSongsByRelevance<
  T extends { title: string; artist: string; content: string; tags: string[] },
>(songs: T[], query: string | undefined): RankedSongMatch<T>[] {
  const q = query?.trim() ?? "";
  if (!q) {
    return songs.map((song) => ({ song, score: 0, matchedField: "title" as const }));
  }

  const ranked: RankedSongMatch<T>[] = [];
  for (const song of songs) {
    const titleScore = scoreField(song.title, q, 100);
    const artistScore = scoreField(song.artist ?? "", q, 60);
    const tagScore = song.tags.some((t) => t.toLowerCase().includes(q.toLowerCase()))
      ? 40
      : 0;
    const lyricsScore = song.content.toLowerCase().includes(q.toLowerCase()) ? 20 : 0;

    const scores: Array<{ field: SongMatchField; score: number }> = [
      { field: "title", score: titleScore },
      { field: "artist", score: artistScore },
      { field: "tag", score: tagScore },
      { field: "lyrics", score: lyricsScore },
    ];
    scores.sort((a, b) => b.score - a.score);
    const best = scores[0]!;
    if (best.score <= 0) continue;
    ranked.push({ song, score: best.score, matchedField: best.field });
  }

  ranked.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.song.title.localeCompare(b.song.title, undefined, { sensitivity: "base" });
  });
  return ranked;
}

/** Rank songs for lyric-stripped search. */
export function rankSongsByLyricRelevance<
  T extends { title: string; content: string },
>(songs: T[], query: string): RankedSongMatch<T & { artist: string; tags: string[] }>[] {
  const q = normalizeLyricQuery(query);
  const out: RankedSongMatch<T & { artist: string; tags: string[] }>[] = [];
  for (const song of songs) {
    if (!lyricsMatchQuery(song.content, q)) continue;
    const titleBoost = scoreField(song.title, q, 30);
    out.push({
      song: song as T & { artist: string; tags: string[] },
      score: 50 + titleBoost,
      matchedField: "lyrics",
    });
  }
  out.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.song.title.localeCompare(b.song.title, undefined, { sensitivity: "base" });
  });
  return out;
}
