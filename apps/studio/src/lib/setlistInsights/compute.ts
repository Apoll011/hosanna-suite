/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SetlistSongInput {
  id: string;
  title?: string | null;
  artist?: string | null;
}

export interface SetlistServiceInput {
  id: string;
  name?: string | null;
  date: string;
  archived?: boolean | null;
  elements?: Array<{
    type?: string | null;
    songId?: string | null;
  }> | null;
}

export interface SongPlayStat {
  songId: string;
  title: string;
  artist: string;
  /** Distinct past/today services that included this song. */
  playCount: number;
  /** Times the song appeared as a setlist element (past/today). */
  appearanceCount: number;
  /** Most recent service date (yyyy-mm-dd) on or before today, or null. */
  lastPlayed: string | null;
  /** Calendar days since lastPlayed; null when never played. */
  daysSinceLastPlayed: number | null;
  /** Name of the most recent service where it was played. */
  lastServiceName: string | null;
  /** Upcoming services (date > today) that already include this song. */
  upcomingCount: number;
}

export interface SetlistInsightsSummary {
  serviceCount: number;
  pastServiceCount: number;
  upcomingServiceCount: number;
  songsTracked: number;
  songsPlayed: number;
  songsNeverPlayed: number;
  totalPlays: number;
  averagePlaysPerSong: number;
  /** All songs with play stats, sorted by playCount desc then lastPlayed desc. */
  songs: SongPlayStat[];
  mostPlayed: SongPlayStat[];
  rarelyPlayed: SongPlayStat[];
  neverPlayed: SongPlayStat[];
  /** Played before, but resting longer than `staleAfterDays`. */
  overdue: SongPlayStat[];
  recentlyPlayed: SongPlayStat[];
}

export interface ComputeSetlistInsightsOptions {
  /** Local calendar date "yyyy-mm-dd". Defaults to today. */
  today?: string;
  /** Songs resting longer than this many days are "overdue". Default 28. */
  staleAfterDays?: number;
  /** How many entries to keep in highlight lists. Default 10. */
  highlightLimit?: number;
  /** "Recently played" window in days. Default 14. */
  recentDays?: number;
}

function localToday(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Whole calendar days between two yyyy-mm-dd dates (b - a). */
export function daysBetween(from: string, to: string): number {
  const a = Date.UTC(
    Number(from.slice(0, 4)),
    Number(from.slice(5, 7)) - 1,
    Number(from.slice(8, 10)),
  );
  const b = Date.UTC(
    Number(to.slice(0, 4)),
    Number(to.slice(5, 7)) - 1,
    Number(to.slice(8, 10)),
  );
  return Math.round((b - a) / 86_400_000);
}

interface MutableStat {
  songId: string;
  title: string;
  artist: string;
  serviceIds: Set<string>;
  appearanceCount: number;
  lastPlayed: string | null;
  lastServiceName: string | null;
  upcomingServiceIds: Set<string>;
}

function compareStats(a: SongPlayStat, b: SongPlayStat): number {
  if (b.playCount !== a.playCount) return b.playCount - a.playCount;
  if ((b.lastPlayed ?? "") !== (a.lastPlayed ?? "")) {
    return (b.lastPlayed ?? "").localeCompare(a.lastPlayed ?? "");
  }
  return a.title.localeCompare(b.title);
}

/**
 * Derive last-played and frequency metrics from local songs + service setlists.
 * Only services with `date <= today` count as plays; future dates are "upcoming".
 */
export function computeSetlistInsights(
  songs: SetlistSongInput[],
  services: SetlistServiceInput[],
  options: ComputeSetlistInsightsOptions = {},
): SetlistInsightsSummary {
  const today = options.today ?? localToday();
  const staleAfterDays = options.staleAfterDays ?? 28;
  const highlightLimit = options.highlightLimit ?? 10;
  const recentDays = options.recentDays ?? 14;

  const byId = new Map<string, MutableStat>();
  for (const song of songs) {
    byId.set(song.id, {
      songId: song.id,
      title: (song.title || "Untitled").trim() || "Untitled",
      artist: (song.artist || "").trim(),
      serviceIds: new Set(),
      appearanceCount: 0,
      lastPlayed: null,
      lastServiceName: null,
      upcomingServiceIds: new Set(),
    });
  }

  let pastServiceCount = 0;
  let upcomingServiceCount = 0;

  for (const service of services) {
    const isUpcoming = service.date > today;
    if (isUpcoming) upcomingServiceCount += 1;
    else pastServiceCount += 1;

    const elements = service.elements ?? [];
    const seenInService = new Set<string>();

    for (const el of elements) {
      if (el.type !== "song" || !el.songId) continue;
      const stat = byId.get(el.songId);
      if (!stat) continue;

      if (isUpcoming) {
        stat.upcomingServiceIds.add(service.id);
        continue;
      }

      stat.appearanceCount += 1;
      if (!seenInService.has(el.songId)) {
        seenInService.add(el.songId);
        stat.serviceIds.add(service.id);
      }

      if (!stat.lastPlayed || service.date > stat.lastPlayed) {
        stat.lastPlayed = service.date;
        stat.lastServiceName = (service.name || "").trim() || null;
      }
    }
  }

  const allSongs: SongPlayStat[] = Array.from(byId.values()).map((stat) => {
    const playCount = stat.serviceIds.size;
    return {
      songId: stat.songId,
      title: stat.title,
      artist: stat.artist,
      playCount,
      appearanceCount: stat.appearanceCount,
      lastPlayed: stat.lastPlayed,
      daysSinceLastPlayed:
        stat.lastPlayed != null ? daysBetween(stat.lastPlayed, today) : null,
      lastServiceName: stat.lastServiceName,
      upcomingCount: stat.upcomingServiceIds.size,
    };
  });

  allSongs.sort(compareStats);

  const songsPlayed = allSongs.filter((s) => s.playCount > 0);
  const neverPlayed = allSongs
    .filter((s) => s.playCount === 0)
    .sort((a, b) => a.title.localeCompare(b.title));
  const totalPlays = songsPlayed.reduce((sum, s) => sum + s.playCount, 0);
  const averagePlaysPerSong =
    allSongs.length === 0
      ? 0
      : Math.round((totalPlays / allSongs.length) * 10) / 10;

  const mostPlayed = songsPlayed.slice(0, highlightLimit);

  const rarelyPlayed = [...songsPlayed]
    .sort((a, b) => {
      if (a.playCount !== b.playCount) return a.playCount - b.playCount;
      return (a.lastPlayed ?? "").localeCompare(b.lastPlayed ?? "");
    })
    .slice(0, highlightLimit);

  const overdue = songsPlayed
    .filter(
      (s) =>
        s.daysSinceLastPlayed != null &&
        s.daysSinceLastPlayed >= staleAfterDays,
    )
    .sort((a, b) => (b.daysSinceLastPlayed ?? 0) - (a.daysSinceLastPlayed ?? 0))
    .slice(0, highlightLimit);

  const recentlyPlayed = songsPlayed
    .filter(
      (s) =>
        s.daysSinceLastPlayed != null && s.daysSinceLastPlayed <= recentDays,
    )
    .sort((a, b) => (b.lastPlayed ?? "").localeCompare(a.lastPlayed ?? ""))
    .slice(0, highlightLimit);

  return {
    serviceCount: services.length,
    pastServiceCount,
    upcomingServiceCount,
    songsTracked: allSongs.length,
    songsPlayed: songsPlayed.length,
    songsNeverPlayed: neverPlayed.length,
    totalPlays,
    averagePlaysPerSong,
    songs: allSongs,
    mostPlayed,
    rarelyPlayed,
    neverPlayed: neverPlayed.slice(0, highlightLimit),
    overdue,
    recentlyPlayed,
  };
}
