/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Input, Spinner, Surface } from "@/src/components/common";
import { useAppNavigate } from "@/src/hooks/useAppNavigate";
import { useServices } from "@/src/hooks/useServices";
import { useAllSongs } from "@/src/hooks/useSongs";
import { useI18n, type TranslationKey } from "@/src/lib/i18n";
import {
  computeSetlistInsights,
  type SongPlayStat,
} from "@/src/lib/setlistInsights";
import {
  CalendarClock,
  ChevronRight,
  Clock3,
  ListMusic,
  Music2,
  Search,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { useParams } from "react-router-dom";

export interface SetlistInsightsTabProps {
  active: boolean;
}

type SortKey = "frequency" | "lastPlayed" | "title";
type SortDir = "asc" | "desc";

function FrequencyBar({ count, max }: { count: number; max: number }) {
  const pct = max <= 0 ? 0 : Math.round((count / max) * 100);
  return (
    <div className="h-1.5 w-16 sm:w-20 rounded-full bg-m3-sidebar overflow-hidden shrink-0">
      <div
        className="h-full rounded-full bg-m3-primary transition-[width]"
        style={{ width: `${Math.max(pct, count > 0 ? 8 : 0)}%` }}
      />
    </div>
  );
}

function SongRow({
  song,
  maxPlays,
  onOpen,
  formatLastPlayed,
  playsLabel,
}: {
  song: SongPlayStat;
  maxPlays: number;
  onOpen: (id: string) => void;
  formatLastPlayed: (song: SongPlayStat) => string;
  playsLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(song.songId)}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-left hover:bg-m3-primary/5 border border-transparent hover:border-m3-primary/20 transition-colors cursor-pointer group"
    >
      <div className="w-8 h-8 rounded-[var(--radius-md)] bg-m3-sidebar flex items-center justify-center shrink-0 group-hover:bg-m3-primary/10">
        <Music2 className="w-4 h-4 text-m3-secondary group-hover:text-m3-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="block text-sm font-semibold text-m3-text truncate">
          {song.title}
        </span>
        <span className="block text-xs text-m3-secondary truncate">
          {song.artist || "—"}
          {" · "}
          {formatLastPlayed(song)}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <FrequencyBar count={song.playCount} max={maxPlays} />
        <span className="text-xs font-semibold tabular-nums text-m3-text w-10 text-right">
          {playsLabel}
        </span>
        <ChevronRight className="w-4 h-4 text-m3-secondary/50 group-hover:text-m3-primary" />
      </div>
    </button>
  );
}

function InsightSection({
  title,
  desc,
  icon: Icon,
  songs,
  maxPlays,
  empty,
  onOpen,
  formatLastPlayed,
  formatPlays,
}: {
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  songs: SongPlayStat[];
  maxPlays: number;
  empty: string;
  onOpen: (id: string) => void;
  formatLastPlayed: (song: SongPlayStat) => string;
  formatPlays: (count: number) => string;
}) {
  return (
    <Surface padding="none" className="overflow-hidden">
      <div className="px-5 py-4 border-b border-m3-border">
        <h3 className="text-sm font-semibold text-m3-text flex items-center gap-2">
          <Icon className="w-4 h-4 text-m3-primary" />
          {title}
        </h3>
        <p className="mt-1 text-caption">{desc}</p>
      </div>
      <div className="p-2 sm:p-3 space-y-0.5">
        {songs.length === 0 ? (
          <p className="text-sm text-m3-secondary px-3 py-8 text-center">
            {empty}
          </p>
        ) : (
          songs.map((song) => (
            <SongRow
              key={song.songId}
              song={song}
              maxPlays={maxPlays}
              onOpen={onOpen}
              formatLastPlayed={formatLastPlayed}
              playsLabel={formatPlays(song.playCount)}
            />
          ))
        )}
      </div>
    </Surface>
  );
}

export const SetlistInsightsTab: React.FC<SetlistInsightsTabProps> = ({
  active,
}) => {
  const { t, locale } = useI18n();
  const { navigate } = useAppNavigate();
  const { slug } = useParams<{ slug: string }>();
  const slugPrefix = slug ? `/${slug}` : "";
  const { songsQuery } = useAllSongs();
  const { servicesQuery } = useServices(true);

  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("frequency");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const songs = useMemo(
    () => songsQuery.data?.songs ?? [],
    [songsQuery.data?.songs],
  );
  const services = useMemo(
    () => servicesQuery.data ?? [],
    [servicesQuery.data],
  );

  const summary = useMemo(
    () => computeSetlistInsights(songs, services),
    [songs, services],
  );

  const maxPlays = summary.mostPlayed[0]?.playCount ?? 0;

  const formatCount = (n: number) => new Intl.NumberFormat(locale).format(n);

  const formatDate = (date: string) =>
    new Date(`${date}T12:00:00`).toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const formatLastPlayed = (song: SongPlayStat) => {
    if (!song.lastPlayed) return t("analytics.setlist.neverPlayed");
    if (song.daysSinceLastPlayed === 0) {
      return t("analytics.setlist.playedToday");
    }
    if (song.daysSinceLastPlayed === 1) {
      return t("analytics.setlist.playedYesterday");
    }
    return t("analytics.setlist.daysAgo", {
      count: song.daysSinceLastPlayed ?? 0,
      date: formatDate(song.lastPlayed),
    });
  };

  const formatPlays = (count: number) =>
    t("analytics.setlist.plays", { count: formatCount(count) });

  const filteredSongs = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = summary.songs;
    if (q) {
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.artist.toLowerCase().includes(q),
      );
    }

    const sorted = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "frequency") {
        cmp = a.playCount - b.playCount;
      } else if (sortKey === "lastPlayed") {
        const aKey = a.lastPlayed ?? "";
        const bKey = b.lastPlayed ?? "";
        cmp = aKey.localeCompare(bKey);
      } else {
        cmp = a.title.localeCompare(b.title);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [summary.songs, query, sortKey, sortDir]);

  if (!active) return null;

  const isLoading =
    (songsQuery.isLoading && songs.length === 0) ||
    (servicesQuery.isLoading && services.length === 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" label={t("common.loading")} />
      </div>
    );
  }

  const openSong = (songId: string) => {
    navigate(`${slugPrefix}/songs/${songId}`);
  };

  const sortOptions: { id: SortKey; labelKey: TranslationKey }[] = [
    { id: "frequency", labelKey: "analytics.setlist.sort.frequency" },
    { id: "lastPlayed", labelKey: "analytics.setlist.sort.lastPlayed" },
    { id: "title", labelKey: "analytics.setlist.sort.title" },
  ];

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "title" ? "asc" : "desc");
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      <section className="space-y-5">
        <div>
          <h2 className="text-title text-m3-text flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-m3-primary" />
            {t("analytics.setlist.title")}
          </h2>
          <p className="mt-1 text-muted">{t("analytics.setlist.desc")}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat
            value={formatCount(summary.songsPlayed)}
            label={t("analytics.setlist.statPlayed")}
          />
          <Stat
            value={formatCount(summary.songsNeverPlayed)}
            label={t("analytics.setlist.statNever")}
          />
          <Stat
            value={formatCount(summary.totalPlays)}
            label={t("analytics.setlist.statTotalPlays")}
          />
          <Stat
            value={formatCount(summary.pastServiceCount)}
            label={t("analytics.setlist.statServices")}
          />
        </div>
      </section>

      <div className="grid gap-5 sm:grid-cols-2">
        <InsightSection
          title={t("analytics.setlist.sections.mostPlayed")}
          desc={t("analytics.setlist.sections.mostPlayedDesc")}
          icon={TrendingUp}
          songs={summary.mostPlayed}
          maxPlays={maxPlays}
          empty={t("analytics.setlist.emptyPlays")}
          onOpen={openSong}
          formatLastPlayed={formatLastPlayed}
          formatPlays={formatPlays}
        />
        <InsightSection
          title={t("analytics.setlist.sections.recent")}
          desc={t("analytics.setlist.sections.recentDesc")}
          icon={Clock3}
          songs={summary.recentlyPlayed}
          maxPlays={maxPlays}
          empty={t("analytics.setlist.emptyRecent")}
          onOpen={openSong}
          formatLastPlayed={formatLastPlayed}
          formatPlays={formatPlays}
        />
        <InsightSection
          title={t("analytics.setlist.sections.overdue")}
          desc={t("analytics.setlist.sections.overdueDesc")}
          icon={CalendarClock}
          songs={summary.overdue}
          maxPlays={maxPlays}
          empty={t("analytics.setlist.emptyOverdue")}
          onOpen={openSong}
          formatLastPlayed={formatLastPlayed}
          formatPlays={formatPlays}
        />
        <InsightSection
          title={
            summary.neverPlayed.length > 0
              ? t("analytics.setlist.sections.never")
              : t("analytics.setlist.sections.rarely")
          }
          desc={
            summary.neverPlayed.length > 0
              ? t("analytics.setlist.sections.neverDesc")
              : t("analytics.setlist.sections.rarelyDesc")
          }
          icon={Sparkles}
          songs={
            summary.neverPlayed.length > 0
              ? summary.neverPlayed
              : summary.rarelyPlayed
          }
          maxPlays={maxPlays}
          empty={t("analytics.setlist.emptyNever")}
          onOpen={openSong}
          formatLastPlayed={formatLastPlayed}
          formatPlays={formatPlays}
        />
      </div>

      <Surface padding="none" className="overflow-hidden">
        <div className="px-5 py-4 border-b border-m3-border space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-m3-text">
              {t("analytics.setlist.allSongs")}
            </h3>
            <p className="mt-1 text-caption">
              {t("analytics.setlist.allSongsDesc")}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <div className="flex-1">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("analytics.setlist.searchPlaceholder")}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="flex items-center gap-1 overflow-x-auto">
              {sortOptions.map((opt) => {
                const activeSort = sortKey === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleSort(opt.id)}
                    className={`px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                      activeSort
                        ? "bg-m3-primary text-white"
                        : "bg-m3-sidebar text-m3-secondary hover:text-m3-text"
                    }`}
                  >
                    {t(opt.labelKey)}
                    {activeSort ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="divide-y divide-m3-border">
          {filteredSongs.length === 0 ? (
            <p className="text-sm text-m3-secondary px-5 py-12 text-center">
              {t("analytics.setlist.noMatch")}
            </p>
          ) : (
            filteredSongs.map((song) => (
              <div key={song.songId} className="px-2 sm:px-3 py-1">
                <button
                  type="button"
                  onClick={() => openSong(song.songId)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-[var(--radius-md)] text-left hover:bg-m3-sidebar/80 transition-colors cursor-pointer group"
                >
                  <div className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-m3-text truncate">
                      {song.title}
                    </span>
                    <span className="block text-xs text-m3-secondary truncate mt-0.5">
                      {song.artist || "—"}
                      {song.lastServiceName ? ` · ${song.lastServiceName}` : ""}
                      {song.upcomingCount > 0
                        ? ` · ${t("analytics.setlist.upcoming", {
                            count: formatCount(song.upcomingCount),
                          })}`
                        : ""}
                    </span>
                  </div>
                  <div className="hidden sm:flex flex-col items-end gap-0.5 shrink-0 min-w-[7rem]">
                    <span className="text-xs font-semibold tabular-nums text-m3-text">
                      {formatPlays(song.playCount)}
                    </span>
                    <span className="text-caption">
                      {formatLastPlayed(song)}
                    </span>
                  </div>
                  <div className="flex sm:hidden flex-col items-end gap-0.5 shrink-0">
                    <span className="text-xs font-semibold tabular-nums">
                      {formatCount(song.playCount)}×
                    </span>
                  </div>
                  <FrequencyBar count={song.playCount} max={maxPlays || 1} />
                  <ChevronRight className="w-4 h-4 text-m3-secondary/50 group-hover:text-m3-primary shrink-0" />
                </button>
              </div>
            ))
          )}
        </div>
      </Surface>
    </div>
  );
};

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="p-3.5 rounded-[var(--radius-md)] border border-m3-border bg-m3-sidebar/60">
      <span className="block text-2xl font-semibold text-m3-text tabular-nums">
        {value}
      </span>
      <span className="text-caption">{label}</span>
    </div>
  );
}
