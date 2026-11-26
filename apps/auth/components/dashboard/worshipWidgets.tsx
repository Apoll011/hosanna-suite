"use client";

import { useI18n } from "@/lib/ui/i18n";
import type { WidgetRendererProps } from "@hosanna/dashboard/react";
import { Badge } from "@hosanna/ui";
import {
  ArrowUpRight,
  Calendar,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock,
  FolderOpen,
  HeartPulse,
  Layers,
  ListMusic,
  MapPin,
  Music2,
  Tags,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useMemo } from "react";
import {
  computeSongHealthInsights,
  daysBetweenYmd,
  diffDaysFromToday,
  extractSongKey,
  formatServiceDate,
  getWidgetDensity,
  SkeletonLine,
  todayYmdLocal,
  useMusicHomeUrl,
  useOrganizationData,
  useReplicationCollection,
  WidgetEmptyBox,
  WidgetErrorBox,
  WidgetHeader,
  WidgetHeaderLink,
  type FolderRow,
  type SongRow,
  type SongsResponse,
} from "./shared";

type ServiceRow = {
  id: string;
  name: string;
  date: string;
  notes?: string;
  elementCount?: number;
  hasSongs?: boolean;
};

type ServiceDetail = {
  id: string;
  elements?: Array<{
    id?: string;
    type?: string;
    title?: string;
    songId?: string | null;
    song?: { id: string; title?: string | null; artist?: string | null } | null;
  }>;
};

export function NextServiceWidget({ instance }: WidgetRendererProps) {
  const { t, locale } = useI18n();
  const musicUrl = useMusicHomeUrl();
  const density = getWidgetDensity(instance);
  const { value, loading, error } = useOrganizationData<ServiceRow[]>(
    "services",
    "/services?metadataOnly=true",
  );
  const today = todayYmdLocal();
  const upcoming = useMemo(
    () =>
      (value ?? [])
        .filter((service) => service.date.slice(0, 10) >= today)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [value, today],
  );
  const next = upcoming[0];
  const following = upcoming[1];
  const showSetlist = density === "expanded" && Boolean(next?.id && next?.hasSongs);
  const { value: nextDetail } = useOrganizationData<ServiceDetail>(
    `service-detail-${next?.id ?? "none"}`,
    next ? `/services/${next.id}` : "",
    showSetlist,
  );
  const setlistSongs = useMemo(() => {
    const elements = nextDetail?.elements ?? [];
    return elements
      .filter((el) => el.type === "song")
      .slice(0, 5)
      .map((el, idx) => ({
        key: el.id ?? `${idx}`,
        title: el.song?.title || el.title || t("home.widgets.recentSongs.untitled"),
      }));
  }, [nextDetail?.elements, t]);

  if (density === "compact" && next && !loading && !error) {
    const diff = diffDaysFromToday(next.date);
    const content = (
      <div className="flex h-full items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Badge variant={diff <= 1 ? "accent" : "neutral"} size="sm">
              {diff === 0
                ? t("home.widgets.nextService.today")
                : diff === 1
                  ? t("home.widgets.nextService.tomorrow")
                  : t("home.widgets.nextService.inDays", { count: diff })}
            </Badge>
            <span className="truncate text-caption">{formatServiceDate(next.date, locale)}</span>
          </div>
          <p className="mt-1 truncate text-sm font-semibold text-m3-text">{next.name}</p>
        </div>
        {musicUrl ? (
          <ChevronRight className="h-4 w-4 shrink-0 text-m3-secondary" aria-hidden />
        ) : null}
      </div>
    );
    return musicUrl ? (
      <a href={`${musicUrl}/services/${next.id}`} className="block h-full">
        {content}
      </a>
    ) : (
      content
    );
  }

  return (
    <>
      <WidgetHeader
        title={t("home.widgets.nextService.title")}
        action={
          upcoming.length > 0 ? (
            <Badge variant="neutral" size="sm" className="tabular-nums">
              {t("home.widgets.nextService.upcomingCount", { count: upcoming.length })}
            </Badge>
          ) : null
        }
      />
      {loading ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <SkeletonLine className="h-5 w-16 rounded-sm" />
            <SkeletonLine className="h-4 w-28" />
          </div>
          <SkeletonLine className="h-5 w-44" />
          <SkeletonLine className="h-10 w-full rounded-md" />
        </div>
      ) : error ? (
        <WidgetErrorBox message={t("home.widgets.error")} />
      ) : next ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={diffDaysFromToday(next.date) <= 1 ? "accent" : "neutral"} size="sm">
              {diffDaysFromToday(next.date) === 0
                ? t("home.widgets.nextService.today")
                : diffDaysFromToday(next.date) === 1
                  ? t("home.widgets.nextService.tomorrow")
                  : t("home.widgets.nextService.inDays", { count: diffDaysFromToday(next.date) })}
            </Badge>
            <span className="inline-flex items-center gap-1.5 text-caption">
              <Calendar className="h-3.5 w-3.5" aria-hidden />
              {formatServiceDate(next.date, locale)}
            </span>
          </div>

          <div>
            <p className="truncate text-base font-semibold text-m3-text">{next.name}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-caption tabular-nums">
              {typeof next.elementCount === "number" ? (
                <span className="inline-flex items-center gap-1 rounded-sm bg-m3-sidebar px-2 py-0.5">
                  {t("home.widgets.nextService.elements", { count: next.elementCount })}
                </span>
              ) : null}
              {next.hasSongs ? (
                <span className="inline-flex items-center gap-1 rounded-sm bg-m3-sidebar px-2 py-0.5">
                  <Music2 className="h-3 w-3" aria-hidden />
                  {t("home.widgets.nextService.hasSongs")}
                </span>
              ) : null}
            </div>
          </div>

          {setlistSongs.length > 0 ? (
            <div className="surface-inset space-y-1 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-m3-secondary">
                {t("home.widgets.nextService.setlistPreview")}
              </p>
              <ol className="space-y-0.5 text-xs text-m3-text">
                {setlistSongs.map((item, idx) => (
                  <li key={item.key} className="flex items-center gap-1.5 truncate">
                    <span className="w-4 shrink-0 tabular-nums text-m3-secondary">{idx + 1}.</span>
                    <span className="truncate">{item.title}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : next.notes?.trim() ? (
            <p className="surface-inset line-clamp-2 px-3 py-2 text-xs text-m3-secondary">
              {next.notes.trim()}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
            {following ? (
              <span className="truncate text-caption">
                {t("home.widgets.nextService.then")}: {following.name} (
                {formatServiceDate(following.date, locale)})
              </span>
            ) : musicUrl ? (
              <a
                href={`${musicUrl}/services`}
                className="text-xs font-medium text-m3-secondary hover:text-m3-text"
              >
                {t("home.widgets.nextService.allServices")}
              </a>
            ) : (
              <span />
            )}
            {musicUrl ? (
              <a
                href={`${musicUrl}/services/${next.id}`}
                className="inline-flex items-center gap-1 text-xs font-medium text-m3-primary hover:underline"
              >
                {t("home.widgets.nextService.open")}
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </a>
            ) : null}
          </div>
        </div>
      ) : (
        <WidgetEmptyBox
          icon={<Calendar className="h-5 w-5" />}
          title={t("home.widgets.nextService.empty")}
          description={t("home.widgets.nextService.emptyHint")}
          action={
            musicUrl ? (
              <a
                href={`${musicUrl}/services`}
                className="inline-flex items-center gap-1.5 rounded-md border border-m3-border bg-m3-card px-3 py-1.5 text-xs font-medium text-m3-text transition-colors hover:bg-m3-hover"
              >
                {t("home.widgets.nextService.plan")}
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </a>
            ) : undefined
          }
        />
      )}
    </>
  );
}

export function LibrarySummaryWidget({ instance }: WidgetRendererProps) {
  const { t } = useI18n();
  const musicUrl = useMusicHomeUrl();
  const density = getWidgetDensity(instance);
  const { value, loading, error } = useOrganizationData<SongsResponse>(
    "songs-summary",
    "/songs?limit=150",
  );
  const { value: folders } = useOrganizationData<FolderRow[]>("folders-summary", "/folders");

  const songs = useMemo(() => value?.songs ?? [], [value?.songs]);
  const total = value?.total ?? 0;
  const insights = useMemo(() => computeSongHealthInsights(songs), [songs]);

  if (density === "compact" && !loading && !error && total > 0) {
    return (
      <div className="flex h-full items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-caption">{t("home.widgets.library.title")}</p>
          <p className="mt-0.5 tabular-nums text-xl font-semibold text-m3-text">
            {total}
            <span className="ml-1.5 text-xs font-normal text-m3-secondary">
              {t("home.widgets.library.songs")}
            </span>
          </p>
        </div>
        <div className="text-right tabular-nums">
          <p className="text-xs font-medium text-m3-text">{folders?.length ?? 0}</p>
          <p className="text-caption">{t("home.widgets.library.folders")}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <WidgetHeader
        title={t("home.widgets.library.title")}
        action={
          musicUrl ? (
            <WidgetHeaderLink href={`${musicUrl}/songs`} label={t("home.widgets.library.open")} />
          ) : null
        }
      />
      {loading ? (
        <div className="space-y-3">
          <SkeletonLine className="h-7 w-28" />
          <div className="grid grid-cols-2 gap-2">
            <SkeletonLine className="h-14 w-full rounded-md" />
            <SkeletonLine className="h-14 w-full rounded-md" />
          </div>
        </div>
      ) : error ? (
        <WidgetErrorBox message={t("home.widgets.error")} />
      ) : total === 0 ? (
        <WidgetEmptyBox
          icon={<Music2 className="h-5 w-5" />}
          title={t("home.widgets.library.empty")}
          description={t("home.widgets.library.emptyHint")}
        />
      ) : (
        <div className="space-y-3">
          <p className="tabular-nums text-2xl font-semibold leading-none text-m3-text">
            {total}
            <span className="ml-1.5 text-sm font-normal text-m3-secondary">
              {t("home.widgets.library.songs")}
            </span>
          </p>

          <div className={`grid gap-2 ${instance.w >= 5 || density === "expanded" ? "grid-cols-4" : "grid-cols-2"}`}>
            <div className="surface-inset px-2.5 py-2">
              <p className="text-caption truncate">{t("home.widgets.library.folders")}</p>
              <p className="mt-0.5 flex items-center gap-1 text-sm font-semibold tabular-nums text-m3-text">
                <FolderOpen className="h-3.5 w-3.5 text-m3-secondary" aria-hidden />
                {folders?.length ?? 0}
              </p>
            </div>
            <div className="surface-inset px-2.5 py-2">
              <p className="text-caption truncate">{t("home.widgets.library.withChords")}</p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums text-m3-text">
                {songs.length > 0 ? Math.round((insights.withChords / songs.length) * 100) : 0}%
              </p>
            </div>
            {instance.w >= 5 || density === "expanded" ? (
              <>
                <div className="surface-inset px-2.5 py-2">
                  <p className="text-caption truncate">{t("home.widgets.library.withKey")}</p>
                  <p className="mt-0.5 text-sm font-semibold tabular-nums text-m3-text">
                    {songs.length > 0 ? Math.round((insights.withKey / songs.length) * 100) : 0}%
                  </p>
                </div>
                <div className="surface-inset px-2.5 py-2">
                  <p className="text-caption truncate">{t("home.widgets.library.withTags")}</p>
                  <p className="mt-0.5 text-sm font-semibold tabular-nums text-m3-text">
                    {songs.length > 0 ? Math.round((insights.withTags / songs.length) * 100) : 0}%
                  </p>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}

export function RepertoireKeysWidget({ instance }: WidgetRendererProps) {
  const { t } = useI18n();
  const musicUrl = useMusicHomeUrl();
  const density = getWidgetDensity(instance);
  const { value, loading, error } = useOrganizationData<SongsResponse>(
    "songs-summary",
    "/songs?limit=150",
  );
  const songs = useMemo(() => value?.songs ?? [], [value?.songs]);
  const insights = useMemo(() => computeSongHealthInsights(songs), [songs]);
  const hasAny = insights.topKeys.length > 0 || insights.topTags.length > 0;

  if (density === "compact" && !loading && !error && hasAny) {
    return (
      <div className="flex h-full flex-col justify-center gap-1.5">
        <p className="text-caption">{t("home.widgets.repertoireKeys.title")}</p>
        <div className="flex flex-wrap gap-1">
          {insights.topKeys.slice(0, 3).map(([key, count]) => (
            <Badge key={key} variant="accent" size="sm" className="font-mono tabular-nums">
              {key} · {count}
            </Badge>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <WidgetHeader
        title={t("home.widgets.repertoireKeys.title")}
        action={
          musicUrl ? (
            <WidgetHeaderLink
              href={`${musicUrl}/songs`}
              label={t("home.widgets.repertoireKeys.open")}
            />
          ) : null
        }
      />
      {loading ? (
        <div className="space-y-2.5">
          <SkeletonLine className="h-6 w-40" />
          <SkeletonLine className="h-6 w-48" />
        </div>
      ) : error ? (
        <WidgetErrorBox message={t("home.widgets.error")} />
      ) : !hasAny ? (
        <WidgetEmptyBox
          icon={<Tags className="h-5 w-5" />}
          title={t("home.widgets.repertoireKeys.empty")}
          description={t("home.widgets.repertoireKeys.emptyHint")}
        />
      ) : (
        <div className="space-y-3">
          {insights.topKeys.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-caption">{t("home.widgets.repertoireKeys.keysLabel")}</p>
              <div className="flex flex-wrap gap-1.5">
                {insights.topKeys.map(([key, count]) => (
                  <Badge key={key} variant="accent" size="sm" className="font-mono tabular-nums">
                    {key} · {count}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
          {insights.topTags.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-caption">{t("home.widgets.repertoireKeys.tagsLabel")}</p>
              <div className="flex flex-wrap gap-1.5">
                {insights.topTags.map(([tag, count]) => (
                  <Badge key={tag} variant="neutral" size="sm" className="tabular-nums">
                    {tag} · {count}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </>
  );
}

export function LibraryHealthWidget({ instance }: WidgetRendererProps) {
  const { t } = useI18n();
  const musicUrl = useMusicHomeUrl();
  const density = getWidgetDensity(instance);
  const { value, loading, error } = useOrganizationData<SongsResponse>(
    "songs-summary",
    "/songs?limit=150",
  );
  const songs = useMemo(() => value?.songs ?? [], [value?.songs]);
  const total = value?.total ?? 0;
  const health = useMemo(() => computeSongHealthInsights(songs), [songs]);
  const criteriaLimit = density === "expanded" ? 6 : 3;
  const topMissing = health.missingCounts.slice(0, criteriaLimit);

  const tone =
    health.healthPct >= 80
      ? "stroke-emerald-500 text-emerald-600 dark:text-emerald-400"
      : health.healthPct >= 55
        ? "stroke-amber-500 text-amber-600 dark:text-amber-400"
        : "stroke-rose-500 text-rose-600 dark:text-rose-400";
  const ringCircumference = 2 * Math.PI * 22;
  const ringDash = `${(health.healthPct / 100) * ringCircumference} ${ringCircumference}`;

  if (density === "compact" && !loading && !error && total > 0) {
    return (
      <div className="flex h-full items-center gap-3">
        <span
          className={`text-xl font-semibold tabular-nums ${tone.split(" ").slice(1).join(" ")}`}
        >
          {health.healthPct}%
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-m3-text">
            {t("home.widgets.libraryHealth.title")}
          </p>
          <p className="truncate text-caption tabular-nums">
            {t("home.widgets.libraryHealth.healthy", { count: health.healthyCount })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <WidgetHeader
        title={t("home.widgets.libraryHealth.title")}
        action={
          musicUrl ? (
            <WidgetHeaderLink
              href={`${musicUrl}/analytics?tab=libraryHealth`}
              label={t("home.widgets.libraryHealth.open")}
            />
          ) : null
        }
      />
      {loading ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <SkeletonLine className="h-14 w-14 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <SkeletonLine className="h-4 w-32" />
              <SkeletonLine className="h-3 w-24" />
            </div>
          </div>
          <SkeletonLine className="h-16 w-full rounded-md" />
        </div>
      ) : error ? (
        <WidgetErrorBox message={t("home.widgets.error")} />
      ) : total === 0 ? (
        <WidgetEmptyBox
          icon={<HeartPulse className="h-5 w-5" />}
          title={t("home.widgets.library.empty")}
          description={t("home.widgets.library.emptyHint")}
        />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3.5">
            <div className="relative h-14 w-14 shrink-0">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 56 56" aria-hidden>
                <circle
                  cx="28"
                  cy="28"
                  r="22"
                  fill="none"
                  strokeWidth="5"
                  className="stroke-m3-border/70"
                />
                <circle
                  cx="28"
                  cy="28"
                  r="22"
                  fill="none"
                  strokeWidth="5"
                  strokeLinecap="round"
                  className={tone.split(" ")[0]}
                  strokeDasharray={ringDash}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-xs font-semibold tabular-nums ${tone}`}>
                  {health.healthPct}%
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="success" size="sm" className="tabular-nums">
                {t("home.widgets.libraryHealth.healthy", { count: health.healthyCount })}
              </Badge>
              {health.needsAttentionCount > 0 ? (
                <Badge variant="warning" size="sm" className="tabular-nums">
                  {t("home.widgets.libraryHealth.needsAttention", {
                    count: health.needsAttentionCount,
                  })}
                </Badge>
              ) : null}
            </div>
          </div>

          {topMissing.length === 0 ? (
            <div className="surface-inset flex items-center gap-2 px-3 py-2.5 text-xs text-m3-secondary">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden />
              <span>{t("home.widgets.libraryHealth.allHealthy")}</span>
            </div>
          ) : (
            <ul className="space-y-2">
              {topMissing.map(({ criterion, count }) => {
                const pct = songs.length > 0 ? Math.round((count / songs.length) * 100) : 0;
                return (
                  <li key={criterion} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-m3-text">
                        {t(
                          `home.widgets.libraryHealth.missing.${criterion}` as Parameters<
                            typeof t
                          >[0],
                        )}
                      </span>
                      <span className="tabular-nums text-m3-secondary">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-m3-sidebar">
                      <div
                        className="h-full rounded-full bg-m3-primary/75"
                        style={{ width: `${Math.max(pct, 6)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </>
  );
}

type ReplServiceRow = {
  id: string;
  name: string;
  date: string;
  elements?: Array<{ type?: string | null; songId?: string | null }>;
  isDeleted?: boolean;
  _deleted?: boolean;
};

type ReplSongRow = SongRow & { isDeleted?: boolean; _deleted?: boolean };

function useSetlistStats() {
  const { t } = useI18n();
  const songsRes = useReplicationCollection<ReplSongRow>("songs", 250);
  const servicesRes = useReplicationCollection<ReplServiceRow>("services", 200);

  const summary = useMemo(() => {
    const songs = songsRes.value ?? [];
    const services = servicesRes.value ?? [];
    const today = todayYmdLocal();

    const byId = new Map<
      string,
      {
        id: string;
        title: string;
        artist: string;
        serviceIds: Set<string>;
        lastPlayed: string | null;
      }
    >();
    for (const song of songs) {
      byId.set(song.id, {
        id: song.id,
        title: song.title?.trim() || t("home.widgets.recentSongs.untitled"),
        artist: song.artist?.trim() || "",
        serviceIds: new Set(),
        lastPlayed: null,
      });
    }

    let pastServices = 0;
    for (const service of services) {
      const ymd = service.date.slice(0, 10);
      if (ymd > today) continue;
      pastServices += 1;
      for (const el of service.elements ?? []) {
        if (el.type !== "song" || !el.songId) continue;
        const stat = byId.get(el.songId);
        if (!stat) continue;
        stat.serviceIds.add(service.id);
        if (!stat.lastPlayed || ymd > stat.lastPlayed) {
          stat.lastPlayed = ymd;
        }
      }
    }

    const stats = [...byId.values()].map((s) => ({
      id: s.id,
      title: s.title,
      artist: s.artist,
      playCount: s.serviceIds.size,
      lastPlayed: s.lastPlayed,
      daysSince: s.lastPlayed ? daysBetweenYmd(s.lastPlayed, today) : null,
    }));

    const top = [...stats]
      .filter((s) => s.playCount > 0)
      .sort((a, b) => b.playCount - a.playCount || a.title.localeCompare(b.title));
    const resting = [...stats]
      .filter((s) => s.playCount > 0 && (s.daysSince ?? 0) >= 28)
      .sort((a, b) => (b.daysSince ?? 0) - (a.daysSince ?? 0));

    return { pastServices, top, resting, maxPlays: top[0]?.playCount ?? 1 };
  }, [songsRes.value, servicesRes.value, t]);

  return {
    loading: songsRes.loading || servicesRes.loading,
    error: songsRes.error || servicesRes.error,
    summary,
  };
}

export function MostPlayedSongsWidget({ instance }: WidgetRendererProps) {
  const { t } = useI18n();
  const musicUrl = useMusicHomeUrl();
  const density = getWidgetDensity(instance);
  const { loading, error, summary } = useSetlistStats();
  const rowLimit = instance.h <= 1 ? 2 : Math.min(Math.max(instance.h - 1, 2), 8);
  const showArtist = instance.w >= 3;
  const showBar = instance.w >= 5;
  const rows = summary.top.slice(0, rowLimit);

  return (
    <>
      <WidgetHeader
        title={t("home.widgets.mostPlayed.title")}
        action={
          <div className="flex items-center gap-2">
            {!loading && !error && summary.pastServices > 0 && density !== "compact" ? (
              <Badge variant="neutral" size="sm" className="tabular-nums">
                {t("home.widgets.mostPlayed.pastServices", { count: summary.pastServices })}
              </Badge>
            ) : null}
            {musicUrl ? (
              <WidgetHeaderLink
                href={`${musicUrl}/analytics?tab=setlist`}
                label={t("home.widgets.mostPlayed.open")}
              />
            ) : null}
          </div>
        }
      />
      {loading ? (
        <div className="space-y-2.5">
          {[0, 1, 2].map((item) => (
            <SkeletonLine key={item} className="h-9 w-full rounded-md" />
          ))}
        </div>
      ) : error ? (
        <WidgetErrorBox message={t("home.widgets.error")} />
      ) : rows.length === 0 ? (
        <WidgetEmptyBox
          icon={<TrendingUp className="h-5 w-5" />}
          title={t("home.widgets.mostPlayed.empty")}
          description={t("home.widgets.mostPlayed.emptyHint")}
        />
      ) : (
        <ul className="divide-y divide-m3-border/60">
          {rows.map((song) => {
            const pct = Math.max(8, Math.round((song.playCount / summary.maxPlays) * 100));
            const inner = (
              <div className="flex items-center justify-between gap-2 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-m3-text">{song.title}</p>
                  {song.artist && showArtist ? (
                    <p className="truncate text-caption">{song.artist}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {showBar ? (
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-m3-sidebar">
                      <div
                        className="h-full rounded-full bg-m3-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  ) : null}
                  <span className="w-8 text-right text-xs font-semibold tabular-nums text-m3-text">
                    {t("home.widgets.mostPlayed.plays", { count: song.playCount })}
                  </span>
                </div>
              </div>
            );
            return (
              <li key={song.id}>
                {musicUrl ? (
                  <a
                    href={`${musicUrl}/songs/${song.id}`}
                    className="block rounded px-1 transition-colors hover:bg-m3-hover/50"
                  >
                    {inner}
                  </a>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export function RestingSongsWidget({ instance }: WidgetRendererProps) {
  const { t } = useI18n();
  const musicUrl = useMusicHomeUrl();
  const density = getWidgetDensity(instance);
  const { loading, error, summary } = useSetlistStats();
  const rowLimit = instance.h <= 1 ? 2 : Math.min(Math.max(instance.h - 1, 2), 8);
  const showArtist = instance.w >= 3;
  const rows = summary.resting.slice(0, rowLimit);

  if (density === "compact" && !loading && !error) {
    return (
      <div className="flex h-full items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-caption">{t("home.widgets.restingSongs.title")}</p>
          <p className="mt-0.5 truncate text-sm font-semibold text-m3-text">
            {rows[0]?.title ?? t("home.widgets.restingSongs.empty")}
          </p>
        </div>
        <Badge
          variant={summary.resting.length > 0 ? "warning" : "neutral"}
          size="sm"
          className="tabular-nums"
        >
          {summary.resting.length}
        </Badge>
      </div>
    );
  }

  return (
    <>
      <WidgetHeader
        title={t("home.widgets.restingSongs.title")}
        action={
          <div className="flex items-center gap-2">
            {!loading && !error && summary.resting.length > 0 ? (
              <Badge variant="warning" size="sm" className="tabular-nums">
                {t("home.widgets.restingSongs.restingCount", { count: summary.resting.length })}
              </Badge>
            ) : null}
            {musicUrl ? (
              <WidgetHeaderLink
                href={`${musicUrl}/analytics?tab=setlist`}
                label={t("home.widgets.restingSongs.open")}
              />
            ) : null}
          </div>
        }
      />
      {loading ? (
        <div className="space-y-2.5">
          {[0, 1, 2].map((item) => (
            <SkeletonLine key={item} className="h-9 w-full rounded-md" />
          ))}
        </div>
      ) : error ? (
        <WidgetErrorBox message={t("home.widgets.error")} />
      ) : rows.length === 0 ? (
        <WidgetEmptyBox
          icon={<Clock className="h-5 w-5" />}
          title={t("home.widgets.restingSongs.empty")}
          description={t("home.widgets.restingSongs.emptyHint")}
        />
      ) : (
        <ul className="divide-y divide-m3-border/60">
          {rows.map((song) => {
            const inner = (
              <div className="flex items-center justify-between gap-2 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-m3-text">{song.title}</p>
                  {song.artist && showArtist ? <p className="truncate text-caption">{song.artist}</p> : null}
                </div>
                <Badge variant="warning" size="sm" className="tabular-nums">
                  {t("home.widgets.restingSongs.daysAgo", { count: song.daysSince ?? 0 })}
                </Badge>
              </div>
            );
            return (
              <li key={song.id}>
                {musicUrl ? (
                  <a
                    href={`${musicUrl}/songs/${song.id}`}
                    className="block rounded px-1 transition-colors hover:bg-m3-hover/50"
                  >
                    {inner}
                  </a>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export function RecentSongsWidget({ instance }: WidgetRendererProps) {
  const { t } = useI18n();
  const musicUrl = useMusicHomeUrl();
  const density = getWidgetDensity(instance);
  const rawLimit = typeof instance.config?.limit === "number" ? instance.config.limit : 5;
  const maxForDensity = instance.h <= 1 ? 2 : Math.min(Math.max(instance.h - 1, 2), 10);
  const limit = Math.min(rawLimit, maxForDensity);
  const showArtist = instance.w >= 3;
  const { value, loading, error } = useOrganizationData<SongsResponse>(
    "songs-recent",
    "/songs?limit=10",
  );
  const songs = useMemo(() => (value?.songs ?? []).slice(0, limit), [value?.songs, limit]);

  return (
    <>
      <WidgetHeader
        title={t("home.widgets.recentSongs.title")}
        action={
          musicUrl ? (
            <WidgetHeaderLink
              href={`${musicUrl}/songs`}
              label={t("home.widgets.recentSongs.open")}
            />
          ) : null
        }
      />
      {loading ? (
        <div className="space-y-2.5">
          {[0, 1, 2].map((item) => (
            <SkeletonLine key={item} className="h-9 w-full rounded-md" />
          ))}
        </div>
      ) : error ? (
        <WidgetErrorBox message={t("home.widgets.error")} />
      ) : songs.length === 0 ? (
        <WidgetEmptyBox
          icon={<Music2 className="h-5 w-5" />}
          title={t("home.widgets.recentSongs.empty")}
          description={t("home.widgets.recentSongs.emptyHint")}
        />
      ) : (
        <ul className="divide-y divide-m3-border/60">
          {songs.map((song) => {
            const key = extractSongKey(song.content);
            const row = (
              <div className="flex items-center justify-between gap-2.5 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-m3-text">
                    {song.title?.trim() || t("home.widgets.recentSongs.untitled")}
                  </p>
                  {song.artist?.trim() && showArtist ? (
                    <p className="truncate text-caption">{song.artist.trim()}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {key ? (
                    <Badge variant="neutral" size="sm" className="font-mono">
                      {key}
                    </Badge>
                  ) : null}
                  {musicUrl ? (
                    <ChevronRight className="h-4 w-4 text-m3-secondary" aria-hidden />
                  ) : null}
                </div>
              </div>
            );
            return (
              <li key={song.id}>
                {musicUrl ? (
                  <a
                    href={`${musicUrl}/songs/${song.id}`}
                    className="block rounded px-1 transition-colors hover:bg-m3-hover/50"
                  >
                    {row}
                  </a>
                ) : (
                  row
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export function UpcomingServicesWidget({ instance }: WidgetRendererProps) {
  const { t, locale } = useI18n();
  const musicUrl = useMusicHomeUrl();
  const density = getWidgetDensity(instance);
  const { value, loading, error } = useOrganizationData<ServiceRow[]>(
    "services",
    "/services?metadataOnly=true",
  );
  const today = todayYmdLocal();
  const rowLimit = instance.h <= 1 ? 2 : Math.min(Math.max(instance.h - 1, 2), 10);
  const showDetails = instance.w >= 3;
  const upcoming = useMemo(
    () =>
      (value ?? [])
        .filter((service) => service.date.slice(0, 10) >= today)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, rowLimit),
    [value, today, rowLimit],
  );

  return (
    <>
      <WidgetHeader
        title={t("home.widgets.upcomingServices.title")}
        action={
          musicUrl ? (
            <WidgetHeaderLink
              href={`${musicUrl}/calendar`}
              label={t("home.widgets.upcomingServices.open")}
            />
          ) : null
        }
      />
      {loading ? (
        <div className="space-y-2.5">
          {[0, 1, 2].map((item) => (
            <SkeletonLine key={item} className="h-10 w-full rounded-md" />
          ))}
        </div>
      ) : error ? (
        <WidgetErrorBox message={t("home.widgets.error")} />
      ) : upcoming.length === 0 ? (
        <WidgetEmptyBox
          icon={<ListMusic className="h-5 w-5" />}
          title={t("home.widgets.upcomingServices.empty")}
          description={t("home.widgets.upcomingServices.emptyHint")}
        />
      ) : (
        <ul className="divide-y divide-m3-border/60">
          {upcoming.map((service) => {
            const diff = diffDaysFromToday(service.date);
            const row = (
              <div className="flex items-center justify-between gap-2.5 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-m3-text">{service.name}</p>
                  <p className="text-caption tabular-nums">
                    {formatServiceDate(service.date, locale)}
                    {showDetails && typeof service.elementCount === "number"
                      ? ` · ${t("home.widgets.upcomingServices.elements", {
                          count: service.elementCount,
                        })}`
                      : ""}
                  </p>
                </div>
                <Badge
                  variant={diff <= 1 ? "accent" : "neutral"}
                  size="sm"
                  className="tabular-nums"
                >
                  {diff === 0
                    ? t("home.widgets.nextService.today")
                    : diff === 1
                      ? t("home.widgets.nextService.tomorrow")
                      : t("home.widgets.nextService.inDays", { count: diff })}
                </Badge>
              </div>
            );
            return (
              <li key={service.id}>
                {musicUrl ? (
                  <a
                    href={`${musicUrl}/services/${service.id}`}
                    className="block rounded px-1 transition-colors hover:bg-m3-hover/50"
                  >
                    {row}
                  </a>
                ) : (
                  row
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

type ReplCollectionRow = {
  id: string;
  name: string;
  color?: string | null;
  songCount?: number;
  songIds?: string[];
  isDeleted?: boolean;
  _deleted?: boolean;
};

export function CollectionsWidget({ instance }: WidgetRendererProps) {
  const { t } = useI18n();
  const musicUrl = useMusicHomeUrl();
  const density = getWidgetDensity(instance);
  const { value, loading, error } = useReplicationCollection<ReplCollectionRow>("collections", 100);
  const rowLimit = instance.h <= 1 ? 2 : Math.min(Math.max(instance.h - 1, 2), 10);
  const collections = useMemo(
    () =>
      [...(value ?? [])]
        .sort(
          (a, b) =>
            (b.songCount ?? b.songIds?.length ?? 0) - (a.songCount ?? a.songIds?.length ?? 0),
        )
        .slice(0, rowLimit),
    [value, rowLimit],
  );

  return (
    <>
      <WidgetHeader
        title={t("home.widgets.collections.title")}
        action={
          musicUrl ? (
            <WidgetHeaderLink
              href={`${musicUrl}/collections`}
              label={t("home.widgets.collections.open")}
            />
          ) : null
        }
      />
      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((item) => (
            <SkeletonLine key={item} className="h-9 w-full rounded-md" />
          ))}
        </div>
      ) : error ? (
        <WidgetErrorBox message={t("home.widgets.error")} />
      ) : collections.length === 0 ? (
        <WidgetEmptyBox
          icon={<Layers className="h-5 w-5" />}
          title={t("home.widgets.collections.empty")}
          description={t("home.widgets.collections.emptyHint")}
        />
      ) : (
        <ul className="divide-y divide-m3-border/60">
          {collections.map((collection) => {
            const count = collection.songCount ?? collection.songIds?.length ?? 0;
            const row = (
              <div className="flex items-center justify-between gap-2.5 py-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full bg-m3-primary"
                    style={collection.color ? { backgroundColor: collection.color } : undefined}
                    aria-hidden
                  />
                  <span className="truncate text-sm font-medium text-m3-text">
                    {collection.name}
                  </span>
                </div>
                <span className="shrink-0 text-caption tabular-nums">
                  {t("home.widgets.collections.songsCount", { count })}
                </span>
              </div>
            );
            return (
              <li key={collection.id}>
                {musicUrl ? (
                  <a
                    href={`${musicUrl}/collections/${collection.id}`}
                    className="block rounded px-1 transition-colors hover:bg-m3-hover/50"
                  >
                    {row}
                  </a>
                ) : (
                  row
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export function FoldersWidget({ instance }: WidgetRendererProps) {
  const { t } = useI18n();
  const musicUrl = useMusicHomeUrl();
  const density = getWidgetDensity(instance);
  const { value, loading, error } = useOrganizationData<FolderRow[]>("folders-summary", "/folders");
  const rowLimit = instance.h <= 1 ? 2 : Math.min(Math.max(instance.h - 1, 2), 10);
  const folders = useMemo(
    () =>
      [...(value ?? [])]
        .filter((f) => !f.parentId)
        .sort((a, b) => (b.songCount ?? 0) - (a.songCount ?? 0))
        .slice(0, rowLimit),
    [value, rowLimit],
  );

  return (
    <>
      <WidgetHeader
        title={t("home.widgets.folders.title")}
        action={
          musicUrl ? (
            <WidgetHeaderLink href={`${musicUrl}/folders`} label={t("home.widgets.folders.open")} />
          ) : null
        }
      />
      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((item) => (
            <SkeletonLine key={item} className="h-9 w-full rounded-md" />
          ))}
        </div>
      ) : error ? (
        <WidgetErrorBox message={t("home.widgets.error")} />
      ) : folders.length === 0 ? (
        <WidgetEmptyBox
          icon={<FolderOpen className="h-5 w-5" />}
          title={t("home.widgets.folders.empty")}
          description={t("home.widgets.folders.emptyHint")}
        />
      ) : (
        <ul className="divide-y divide-m3-border/60">
          {folders.map((folder) => {
            const row = (
              <div className="flex items-center justify-between gap-2.5 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <FolderOpen className="h-4 w-4 shrink-0 text-m3-secondary" aria-hidden />
                  <span className="truncate text-sm font-medium text-m3-text">{folder.name}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-caption tabular-nums">
                  <span>
                    {t("home.widgets.folders.songsCount", { count: folder.songCount ?? 0 })}
                  </span>
                  {instance.w >= 4 && (folder.folderCount ?? 0) > 0 ? (
                    <span>
                      ·{" "}
                      {t("home.widgets.folders.subfoldersCount", {
                        count: folder.folderCount ?? 0,
                      })}
                    </span>
                  ) : null}
                </div>
              </div>
            );
            return (
              <li key={folder.id}>
                {musicUrl ? (
                  <a
                    href={`${musicUrl}/folders`}
                    className="block rounded px-1 transition-colors hover:bg-m3-hover/50"
                  >
                    {row}
                  </a>
                ) : (
                  row
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

type ReplAgendaEvent = {
  id: string;
  date: string;
  title: string;
  time: string;
  durationMinutes?: number;
  location?: string | null;
  linkedServiceId?: string | null;
  responsibilities?: Array<{
    assignees?: Array<{ id?: string; name?: string }>;
  }>;
  isDeleted?: boolean;
  _deleted?: boolean;
};

export function AgendaWidget({ instance }: WidgetRendererProps) {
  const { t, locale } = useI18n();
  const musicUrl = useMusicHomeUrl();
  const density = getWidgetDensity(instance);
  const { value, loading, error } = useReplicationCollection<ReplAgendaEvent>("agendaEvents", 100);
  const today = todayYmdLocal();
  const rowLimit = instance.h <= 1 ? 2 : Math.min(Math.max(instance.h - 1, 2), 10);
  const showLocation = instance.w >= 4;
  const showAssignees = instance.w >= 3;
  const events = useMemo(
    () =>
      (value ?? [])
        .filter((ev) => ev.date.slice(0, 10) >= today)
        .sort((a, b) =>
          a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date),
        )
        .slice(0, rowLimit),
    [value, today, rowLimit],
  );

  return (
    <>
      <WidgetHeader
        title={t("home.widgets.agenda.title")}
        action={
          musicUrl ? (
            <WidgetHeaderLink href={`${musicUrl}/agenda`} label={t("home.widgets.agenda.open")} />
          ) : null
        }
      />
      {loading ? (
        <div className="space-y-2.5">
          {[0, 1, 2].map((item) => (
            <SkeletonLine key={item} className="h-11 w-full rounded-md" />
          ))}
        </div>
      ) : error ? (
        <WidgetErrorBox message={t("home.widgets.error")} />
      ) : events.length === 0 ? (
        <WidgetEmptyBox
          icon={<CalendarClock className="h-5 w-5" />}
          title={t("home.widgets.agenda.empty")}
          description={t("home.widgets.agenda.emptyHint")}
        />
      ) : (
        <ul className="divide-y divide-m3-border/60">
          {events.map((ev) => {
            const assignees = (ev.responsibilities ?? []).reduce(
              (sum, r) => sum + (r.assignees?.length ?? 0),
              0,
            );
            const row = (
              <div className="flex items-start justify-between gap-2.5 py-2">
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="truncate text-sm font-medium text-m3-text">{ev.title}</p>
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-caption tabular-nums">
                    <span>{formatServiceDate(ev.date, locale)}</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" aria-hidden />
                      {ev.time}
                    </span>
                    {showLocation && ev.location ? (
                      <span className="inline-flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                        <span className="truncate">{ev.location}</span>
                      </span>
                    ) : null}
                  </div>
                </div>
                {showAssignees ? (
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {assignees > 0 ? (
                      <Badge variant="neutral" size="sm" className="tabular-nums">
                        {t("home.widgets.agenda.assignees", { count: assignees })}
                      </Badge>
                    ) : null}
                    {density === "expanded" && ev.linkedServiceId ? (
                      <Badge variant="accent" size="sm">
                        {t("home.widgets.agenda.linkedService")}
                      </Badge>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
            return (
              <li key={ev.id}>
                {musicUrl ? (
                  <a
                    href={`${musicUrl}/agenda`}
                    className="block rounded px-1 transition-colors hover:bg-m3-hover/50"
                  >
                    {row}
                  </a>
                ) : (
                  row
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

type TrashResponse = {
  songs?: unknown[];
  folders?: unknown[];
  services?: unknown[];
};

export function TrashWidget({ instance }: WidgetRendererProps) {
  const { t } = useI18n();
  const musicUrl = useMusicHomeUrl();
  const density = getWidgetDensity(instance);
  const { value, loading, error } = useOrganizationData<TrashResponse>("trash-summary", "/trash");
  const songCount = value?.songs?.length ?? 0;
  const folderCount = value?.folders?.length ?? 0;
  const serviceCount = value?.services?.length ?? 0;
  const total = songCount + folderCount + serviceCount;

  if (density === "compact" && !loading && !error) {
    return (
      <div className="flex h-full items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Trash2 className="h-4 w-4 shrink-0 text-m3-secondary" aria-hidden />
          <span className="truncate text-sm font-medium text-m3-text">
            {t("home.widgets.trash.title")}
          </span>
        </div>
        <Badge variant="neutral" size="sm" className="tabular-nums">
          {total}
        </Badge>
      </div>
    );
  }

  return (
    <>
      <WidgetHeader
        title={t("home.widgets.trash.title")}
        action={
          musicUrl ? (
            <WidgetHeaderLink href={`${musicUrl}/trash`} label={t("home.widgets.trash.open")} />
          ) : null
        }
      />
      {loading ? (
        <div className="grid grid-cols-3 gap-2">
          <SkeletonLine className="h-14 w-full rounded-md" />
          <SkeletonLine className="h-14 w-full rounded-md" />
          <SkeletonLine className="h-14 w-full rounded-md" />
        </div>
      ) : error ? (
        <WidgetErrorBox message={t("home.widgets.error")} />
      ) : total === 0 ? (
        <WidgetEmptyBox
          icon={<Trash2 className="h-5 w-5" />}
          title={t("home.widgets.trash.empty")}
          description={t("home.widgets.trash.emptyHint")}
        />
      ) : (
        <div className="space-y-2.5">
          <div className="grid grid-cols-3 gap-2">
            <div className="surface-inset px-2.5 py-2">
              <p className="text-caption truncate">{t("home.widgets.trash.songs")}</p>
              <p className="mt-0.5 text-base font-semibold tabular-nums text-m3-text">
                {songCount}
              </p>
            </div>
            <div className="surface-inset px-2.5 py-2">
              <p className="text-caption truncate">{t("home.widgets.trash.folders")}</p>
              <p className="mt-0.5 text-base font-semibold tabular-nums text-m3-text">
                {folderCount}
              </p>
            </div>
            <div className="surface-inset px-2.5 py-2">
              <p className="text-caption truncate">{t("home.widgets.trash.services")}</p>
              <p className="mt-0.5 text-base font-semibold tabular-nums text-m3-text">
                {serviceCount}
              </p>
            </div>
          </div>
          <p className="text-caption">{t("home.widgets.trash.retention")}</p>
        </div>
      )}
    </>
  );
}
