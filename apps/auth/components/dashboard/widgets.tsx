"use client";
import { authClient } from "@/lib/auth/client";
import { apiFetch, ensureActiveOrganizationSession } from "@/lib/services/api";
import { homeSettings } from "@/lib/dashboard/settings";
import { Badge, loadSuiteApps, localizeSuiteApps, SuiteAppIcon } from "@hosanna/ui";
import type { WidgetRendererProps } from "@hosanna/dashboard/react";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { useI18n } from "@/lib/ui/i18n";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowUpRight,
  Calendar,
  CalendarRange,
  ChevronRight,
  CreditCard,
  FolderOpen,
  LayoutGrid,
  List,
  Music2,
  Plus,
  Search,
  Sparkles,
  Star,
} from "lucide-react";

type AppItem = {
  id: string;
  name: string;
  shortName: string;
  description?: string;
  homeUrl: string | null;
  status: string;
  accessible?: boolean;
  logoUrl?: string | null;
  accent?: string;
};

const cache = new Map<string, { at: number; value: unknown }>();
let lastOrganizationId: string | null = null;

function resetCacheIfOrgChanged(orgId: string) {
  if (lastOrganizationId !== orgId) {
    cache.clear();
    lastOrganizationId = orgId;
  }
}

function useOrganizationData<T>(key: string, path: string, enabled = true) {
  const { organization } = useActiveOrganization();
  const [state, setState] = useState<{
    organizationId: string | null;
    value: T | null;
    error: boolean;
    loading: boolean;
  }>({ organizationId: null, value: null, error: false, loading: enabled });
  useEffect(() => {
    let active = true;
    const orgId = organization?.id;
    if (!orgId || !enabled) {
      setState({ organizationId: orgId ?? null, value: null, error: false, loading: false });
      return;
    }
    resetCacheIfOrgChanged(orgId);
    const cacheKey = orgId + ":" + key;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.at < 60_000) {
      setState({ organizationId: orgId, value: cached.value as T, error: false, loading: false });
      return;
    }
    setState({ organizationId: orgId, value: null, loading: true, error: false });
    void apiFetch<T>(path, { organizationId: orgId })
      .then((value) => {
        cache.set(cacheKey, { at: Date.now(), value });
        if (active) setState({ organizationId: orgId, value, error: false, loading: false });
      })
      .catch(() => {
        if (active) setState({ organizationId: orgId, value: null, error: true, loading: false });
      });
    return () => {
      active = false;
    };
  }, [organization?.id, key, path, enabled]);
  return state.organizationId === (organization?.id ?? null)
    ? state
    : { organizationId: organization?.id ?? null, value: null, error: false, loading: enabled };
}

function useApps() {
  const { organization } = useActiveOrganization();
  const { t } = useI18n();
  const translate = useCallback((key: string) => t(key as Parameters<typeof t>[0]), [t]);
  const [apps, setApps] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const url = "/api/suite/apps?organizationId=" + encodeURIComponent(organization?.id ?? "");
    void loadSuiteApps(url)
      .then((data) => {
        if (active) {
          setApps(localizeSuiteApps(data, translate));
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [translate, organization?.id]);
  return { apps, loading };
}

function useHomeSettings() {
  return useSyncExternalStore(homeSettings.subscribe, homeSettings.get, homeSettings.get);
}

function isOpenableApp(app: AppItem): boolean {
  return app.status !== "coming_soon" && app.accessible !== false && Boolean(app.homeUrl);
}

function toggleFavoriteApp(favorites: readonly string[], appId: string) {
  const exists = favorites.includes(appId);
  homeSettings.set({
    favorites: exists ? favorites.filter((id) => id !== appId) : [...favorites, appId],
  });
}

function WidgetHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="text-title truncate">{title}</h2>
      {action}
    </div>
  );
}

function WidgetErrorBox({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-center gap-2 rounded-md border border-m3-danger/25 bg-m3-danger/5 px-3 py-2.5 text-sm text-m3-danger"
    >
      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
      <span>{message}</span>
    </div>
  );
}

function WidgetEmptyBox({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-m3-border bg-m3-sidebar/40 px-4 py-6 text-center">
      <div className="mb-2.5 rounded-md bg-m3-hover p-2 text-m3-secondary" aria-hidden>
        {icon}
      </div>
      <p className="text-sm font-medium text-m3-text">{title}</p>
      {description ? <p className="mt-1 max-w-xs text-caption">{description}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-m3-border/45 ${className}`} />;
}

export function AppLauncherWidget(_: WidgetRendererProps) {
  const { t } = useI18n();
  const { apps, loading } = useApps();
  const settings = useHomeSettings();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return apps;
    return apps.filter(
      (app) =>
        app.name.toLowerCase().includes(q) ||
        app.shortName.toLowerCase().includes(q) ||
        (app.description ?? "").toLowerCase().includes(q),
    );
  }, [apps, query]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <SkeletonLine className="h-5 w-28" />
          <SkeletonLine className="h-9 w-44 rounded-md" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="flex items-start gap-3 rounded-xl border border-m3-border/70 p-3.5"
            >
              <SkeletonLine className="h-12 w-12 shrink-0 rounded-2xl" />
              <div className="min-w-0 flex-1 space-y-2 pt-1">
                <SkeletonLine className="h-4 w-24" />
                <SkeletonLine className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title">{t("home.widgets.launcher.title")}</h2>
        <div className="flex items-center gap-2">
          <label className="relative min-w-0 flex-1 sm:w-52">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-m3-secondary"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("home.searchPlaceholder")}
              className="h-9 w-full rounded-md border border-m3-border bg-m3-card pl-8 pr-3 text-sm outline-none transition-colors focus:border-m3-primary focus:ring-2 focus:ring-m3-primary/20"
            />
          </label>
          <div className="inline-flex rounded-md border border-m3-border bg-m3-sidebar p-0.5">
            <button
              type="button"
              aria-label={t("home.viewGrid")}
              aria-pressed={view === "grid"}
              onClick={() => setView("grid")}
              className={`rounded-sm p-1.5 transition-colors ${
                view === "grid"
                  ? "bg-m3-card text-m3-primary shadow-xs"
                  : "text-m3-secondary hover:text-m3-text"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
            </button>
            <button
              type="button"
              aria-label={t("home.viewList")}
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
              className={`rounded-sm p-1.5 transition-colors ${
                view === "list"
                  ? "bg-m3-card text-m3-primary shadow-xs"
                  : "text-m3-secondary hover:text-m3-text"
              }`}
            >
              <List className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <WidgetEmptyBox icon={<LayoutGrid className="h-5 w-5" />} title={t("home.empty")} />
      ) : (
        <ul
          className={
            view === "grid" ? "grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-2"
          }
        >
          {filtered.map((app) => {
            const openable = isOpenableApp(app);
            const favorite = settings.favorites.includes(app.id);
            const content = (
              <>
                <SuiteAppIcon logoUrl={app.logoUrl} accent={app.accent} size="md" />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="truncate text-sm font-semibold text-m3-text">{app.name}</span>
                    {!openable ? (
                      <Badge variant="neutral" size="sm">
                        {t("suite.comingSoon")}
                      </Badge>
                    ) : null}
                  </div>
                  {app.description ? (
                    <p className="line-clamp-2 text-caption leading-snug">{app.description}</p>
                  ) : null}
                </div>
                {openable ? (
                  <ChevronRight
                    className="mt-1 h-4 w-4 shrink-0 text-m3-secondary opacity-0 transition-opacity group-hover:opacity-100"
                    aria-hidden
                  />
                ) : null}
              </>
            );
            return (
              <li key={app.id} className="list-none">
                <div
                  className={`group relative flex h-full rounded-xl border border-m3-border bg-m3-card p-3 transition-[border-color,background-color] ${
                    openable ? "hover:border-m3-primary/35 hover:bg-m3-hover/40" : "opacity-75"
                  } ${view === "list" ? "items-center" : ""}`}
                >
                  {openable && app.homeUrl ? (
                    <a
                      href={app.homeUrl}
                      className="flex min-w-0 flex-1 items-start gap-3 pr-8 text-left"
                    >
                      {content}
                    </a>
                  ) : (
                    <div className="flex min-w-0 flex-1 items-start gap-3 pr-8 text-left">
                      {content}
                    </div>
                  )}
                  <button
                    type="button"
                    className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full text-m3-secondary transition-colors hover:bg-m3-hover hover:text-amber-500"
                    aria-label={
                      favorite
                        ? t("home.widgets.favorites.remove")
                        : t("home.widgets.favorites.add")
                    }
                    onClick={() => toggleFavoriteApp(settings.favorites, app.id)}
                  >
                    <Star
                      className={`h-4 w-4 ${favorite ? "fill-amber-400 text-amber-500" : ""}`}
                      aria-hidden
                    />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function FavoritesWidget(_: WidgetRendererProps) {
  const { t } = useI18n();
  const { apps, loading } = useApps();
  const favorites = useHomeSettings().favorites;

  if (loading) {
    return (
      <div className="space-y-3">
        <SkeletonLine className="h-5 w-24" />
        <div className="flex flex-wrap gap-2.5">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="flex w-24 flex-col items-center gap-2 rounded-xl border border-m3-border/70 p-3"
            >
              <SkeletonLine className="h-10 w-10 rounded-xl" />
              <SkeletonLine className="h-3 w-14" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const items = favorites
    .map((id) => apps.find((app) => app.id === id))
    .filter((app): app is AppItem => Boolean(app));
  const nextCandidate = apps.find((app) => isOpenableApp(app) && !favorites.includes(app.id));

  return (
    <>
      <WidgetHeader title={t("home.widgets.favorites.title")} />
      {items.length ? (
        <div className="flex flex-wrap gap-2.5">
          {items.map((app) => {
            const openable = isOpenableApp(app);
            const tile = (
              <div
                className={`flex w-24 flex-col items-center gap-2 rounded-xl border border-m3-border bg-m3-card px-2.5 py-3 transition-[transform,border-color,background-color] ${
                  openable
                    ? "hover:-translate-y-0.5 hover:border-m3-primary/35 hover:bg-m3-hover/40"
                    : "opacity-60"
                }`}
              >
                <SuiteAppIcon logoUrl={app.logoUrl} accent={app.accent} size="sm" />
                <span className="line-clamp-2 text-center text-[11px] font-semibold leading-tight text-m3-text">
                  {app.shortName || app.name}
                </span>
              </div>
            );
            if (!openable || !app.homeUrl) {
              return (
                <div key={app.id} aria-disabled="true">
                  {tile}
                </div>
              );
            }
            if (app.homeUrl.startsWith("/") && !app.homeUrl.startsWith("//")) {
              return (
                <Link key={app.id} href={app.homeUrl}>
                  {tile}
                </Link>
              );
            }
            return (
              <a key={app.id} href={app.homeUrl}>
                {tile}
              </a>
            );
          })}
          {nextCandidate ? (
            <button
              type="button"
              className="flex w-24 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-m3-border bg-m3-sidebar/40 px-2.5 py-3 text-m3-secondary transition-colors hover:border-m3-primary/40 hover:bg-m3-hover/50 hover:text-m3-primary"
              onClick={() => toggleFavoriteApp(favorites, nextCandidate.id)}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-dashed border-current/40">
                <Plus className="h-4 w-4" aria-hidden />
              </span>
              <span className="text-center text-[11px] font-semibold leading-tight">
                {t("home.addShortcut")}
              </span>
            </button>
          ) : null}
        </div>
      ) : (
        <WidgetEmptyBox
          icon={<Star className="h-5 w-5" />}
          title={t("home.widgets.favorites.empty")}
          description={t("home.favoritesEmpty")}
          action={
            nextCandidate ? (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-md border border-m3-border bg-m3-card px-3 py-1.5 text-xs font-medium text-m3-text transition-colors hover:bg-m3-hover"
                onClick={() => toggleFavoriteApp(favorites, nextCandidate.id)}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
                {t("home.addShortcut")}
              </button>
            ) : undefined
          }
        />
      )}
    </>
  );
}

function SingleAppWidget({ appId }: { appId: string }) {
  const { t } = useI18n();
  const { apps, loading } = useApps();
  const favorites = useHomeSettings().favorites;

  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <SkeletonLine className="h-12 w-12 shrink-0 rounded-2xl" />
        <div className="min-w-0 flex-1 space-y-2">
          <SkeletonLine className="h-4 w-24" />
          <SkeletonLine className="h-3 w-full" />
        </div>
      </div>
    );
  }

  const app = apps.find((item) => item.id === appId);
  if (!app) {
    return (
      <WidgetEmptyBox
        icon={<LayoutGrid className="h-4 w-4" />}
        title={t("home.widgets.appUnavailable")}
      />
    );
  }

  const openable = isOpenableApp(app);
  const favorite = favorites.includes(app.id);
  const body = (
    <div className="flex min-w-0 flex-1 items-center gap-3 pr-7">
      <SuiteAppIcon logoUrl={app.logoUrl} accent={app.accent} size="md" />
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold text-m3-text">{app.name}</span>
          {!openable ? (
            <Badge variant="neutral" size="sm">
              {t("suite.comingSoon")}
            </Badge>
          ) : null}
        </div>
        {app.description ? (
          <p className="line-clamp-2 text-caption leading-snug">{app.description}</p>
        ) : null}
      </div>
      {openable ? (
        <ChevronRight
          className="h-4 w-4 shrink-0 text-m3-secondary opacity-0 transition-opacity group-hover:opacity-100"
          aria-hidden
        />
      ) : null}
    </div>
  );

  return (
    <div className="group relative flex h-full items-center">
      {openable && app.homeUrl ? (
        app.homeUrl.startsWith("/") && !app.homeUrl.startsWith("//") ? (
          <Link href={app.homeUrl} className="flex min-w-0 flex-1 items-center">
            {body}
          </Link>
        ) : (
          <a href={app.homeUrl} className="flex min-w-0 flex-1 items-center">
            {body}
          </a>
        )
      ) : (
        body
      )}
      <button
        type="button"
        className="absolute right-0 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-m3-secondary transition-colors hover:bg-m3-hover hover:text-amber-500"
        aria-label={favorite ? t("home.widgets.favorites.remove") : t("home.widgets.favorites.add")}
        onClick={() => toggleFavoriteApp(favorites, app.id)}
      >
        <Star
          className={`h-4 w-4 ${favorite ? "fill-amber-400 text-amber-500" : ""}`}
          aria-hidden
        />
      </button>
    </div>
  );
}

export function AuthAppWidget(_: WidgetRendererProps) {
  return <SingleAppWidget appId="auth" />;
}

export function MusicAppWidget(_: WidgetRendererProps) {
  return <SingleAppWidget appId="music" />;
}

type ServiceRow = {
  id: string;
  name: string;
  date: string;
  notes?: string;
  elementCount?: number;
  hasSongs?: boolean;
};

function todayYmdLocal(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function diffDaysFromToday(ymd: string): number {
  const [y, m, d] = ymd.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return 0;
  const target = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

function formatServiceDate(ymd: string, locale: string): string {
  const [y, m, d] = ymd.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return ymd;
  return new Date(y, m - 1, d).toLocaleDateString(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function NextServiceWidget(_: WidgetRendererProps) {
  const { t, locale } = useI18n();
  const { apps } = useApps();
  const musicUrl = apps.find((app) => app.id === "music")?.homeUrl ?? null;
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

          {next.notes?.trim() ? (
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

type SongRow = {
  id: string;
  title?: string | null;
  artist?: string | null;
  tags?: string[] | null;
  content?: string | null;
};

type SongsResponse = {
  total: number;
  songs?: SongRow[];
};

type FolderRow = {
  id: string;
  name: string;
  songCount?: number;
};

function computeSampleInsights(songs: SongRow[]) {
  if (songs.length === 0) {
    return { healthPct: 100, withChords: 0, withTags: 0, topTags: [] as [string, number][] };
  }
  let scoreSum = 0;
  let withChords = 0;
  let withTags = 0;
  const tagCounts = new Map<string, number>();

  for (const song of songs) {
    const hasTitle = Boolean(song.title?.trim());
    const hasArtist = Boolean(song.artist?.trim());
    const tags = Array.isArray(song.tags) ? song.tags : [];
    const hasTag = tags.length > 0;
    const content = song.content ?? "";
    const hasChord = content.includes("[") && content.includes("]");
    const hasKey = /\{key\s*:/i.test(content);
    if (hasChord) withChords += 1;
    if (hasTag) withTags += 1;
    for (const tag of tags) {
      const clean = tag.trim();
      if (clean) tagCounts.set(clean, (tagCounts.get(clean) ?? 0) + 1);
    }
    const checks = [hasTitle, hasArtist, hasTag, hasChord, hasKey];
    const passed = checks.filter(Boolean).length;
    scoreSum += Math.round((passed / checks.length) * 100);
  }

  const topTags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  return {
    healthPct: Math.round(scoreSum / songs.length),
    withChords,
    withTags,
    topTags,
  };
}

export function LibrarySummaryWidget(_: WidgetRendererProps) {
  const { t } = useI18n();
  const { apps } = useApps();
  const musicUrl = apps.find((app) => app.id === "music")?.homeUrl ?? null;
  const { value, loading, error } = useOrganizationData<SongsResponse>(
    "songs-summary",
    "/songs?limit=100",
  );
  const { value: folders } = useOrganizationData<FolderRow[]>("folders-summary", "/folders");

  const songs = useMemo(() => value?.songs ?? [], [value?.songs]);
  const total = value?.total ?? 0;
  const insights = useMemo(() => computeSampleInsights(songs), [songs]);
  const healthColor =
    insights.healthPct >= 80
      ? "stroke-emerald-500 text-emerald-600 dark:text-emerald-400"
      : insights.healthPct >= 55
        ? "stroke-amber-500 text-amber-600 dark:text-amber-400"
        : "stroke-rose-500 text-rose-600 dark:text-rose-400";
  const ringCircumference = 2 * Math.PI * 26;
  const ringDash = `${(insights.healthPct / 100) * ringCircumference} ${ringCircumference}`;

  return (
    <>
      <WidgetHeader
        title={t("home.widgets.library.title")}
        action={
          musicUrl ? (
            <a
              href={`${musicUrl}/songs`}
              className="inline-flex items-center gap-1 text-xs font-medium text-m3-primary hover:underline"
            >
              {t("home.widgets.library.open")}
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </a>
          ) : null
        }
      />
      {loading ? (
        <div className="flex items-center gap-4">
          <SkeletonLine className="h-16 w-16 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonLine className="h-6 w-24" />
            <SkeletonLine className="h-3 w-36" />
            <div className="flex gap-2">
              <SkeletonLine className="h-5 w-14 rounded-sm" />
              <SkeletonLine className="h-5 w-14 rounded-sm" />
            </div>
          </div>
        </div>
      ) : error ? (
        <WidgetErrorBox message={t("home.widgets.error")} />
      ) : total === 0 ? (
        <WidgetEmptyBox
          icon={<Music2 className="h-5 w-5" />}
          title={t("home.widgets.library.empty")}
          description={t("home.widgets.library.emptyHint")}
          action={
            musicUrl ? (
              <a
                href={`${musicUrl}/songs`}
                className="inline-flex items-center gap-1.5 rounded-md border border-m3-border bg-m3-card px-3 py-1.5 text-xs font-medium text-m3-text transition-colors hover:bg-m3-hover"
              >
                {t("home.widgets.library.open")}
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </a>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 64 64" aria-hidden>
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  fill="none"
                  strokeWidth="6"
                  className="stroke-m3-border/70"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  fill="none"
                  strokeWidth="6"
                  strokeLinecap="round"
                  className={healthColor.split(" ")[0]}
                  strokeDasharray={ringDash}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-xs font-semibold tabular-nums ${healthColor}`}>
                  {insights.healthPct}%
                </span>
              </div>
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <p className="tabular-nums text-2xl font-semibold leading-none text-m3-text">
                {total}
                <span className="ml-1.5 text-sm font-normal text-m3-secondary">
                  {t("home.widgets.library.songs")}
                </span>
              </p>
              <p className="text-caption">{t("home.widgets.library.healthLabel")}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
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
            <div className="surface-inset px-2.5 py-2">
              <p className="text-caption truncate">{t("home.widgets.library.withTags")}</p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums text-m3-text">
                {songs.length > 0 ? Math.round((insights.withTags / songs.length) * 100) : 0}%
              </p>
            </div>
          </div>

          {insights.topTags.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {insights.topTags.map(([tag, count]) => (
                <Badge key={tag} variant="neutral" size="sm" className="tabular-nums">
                  {tag} · {count}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </>
  );
}

type SubscriptionRow = {
  id: string;
  plan: string;
  status: string;
  periodEnd?: string | Date | null;
  cancelAtPeriodEnd?: boolean | null;
  trialEnd?: string | Date | null;
  billingInterval?: string | null;
};

type SubscriptionWidgetState = {
  entitled: boolean;
  subscription: SubscriptionRow | null;
};

export function SubscriptionWidget(_: WidgetRendererProps) {
  const { t, locale } = useI18n();
  const { organization } = useActiveOrganization();
  const [state, setState] = useState<{
    organizationId: string | null;
    value: SubscriptionWidgetState | null;
    loading: boolean;
    error: boolean;
  }>({ organizationId: null, value: null, loading: true, error: false });

  useEffect(() => {
    let active = true;
    const orgId = organization?.id;
    if (!orgId) {
      setState({ organizationId: null, value: null, loading: false, error: false });
      return;
    }
    resetCacheIfOrgChanged(orgId);
    const cacheKey = orgId + ":subscription-details";
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.at < 60_000) {
      setState({
        organizationId: orgId,
        value: cached.value as SubscriptionWidgetState,
        loading: false,
        error: false,
      });
      return;
    }
    setState({ organizationId: orgId, value: null, loading: true, error: false });
    void ensureActiveOrganizationSession(orgId)
      .then(async () => {
        const [entitledRes, listRes] = await Promise.all([
          fetch("/api/billing/entitlement", { credentials: "include" }).then(async (res) => {
            if (!res.ok) throw new Error("Request failed");
            return (await res.json()) as { entitled: boolean };
          }),
          authClient.subscription
            .list({ query: { referenceId: orgId, customerType: "organization" } })
            .catch(() => ({ data: null })),
        ]);
        const rows = Array.isArray(listRes.data) ? (listRes.data as SubscriptionRow[]) : [];
        const activeSub =
          rows.find((row) => row.status === "active" || row.status === "trialing") ??
          rows[0] ??
          null;
        return { entitled: entitledRes.entitled, subscription: activeSub };
      })
      .then((value) => {
        cache.set(cacheKey, { at: Date.now(), value });
        if (active) setState({ organizationId: orgId, value, loading: false, error: false });
      })
      .catch(() => {
        if (active) setState({ organizationId: orgId, value: null, loading: false, error: true });
      });
    return () => {
      active = false;
    };
  }, [organization?.id]);

  const currentState =
    state.organizationId === (organization?.id ?? null)
      ? state
      : { organizationId: organization?.id ?? null, value: null, loading: true, error: false };
  const { value, loading, error } = currentState;
  const sub = value?.subscription;
  const isTrialing = sub?.status === "trialing";
  const isCanceling = Boolean(sub?.cancelAtPeriodEnd);
  const targetDate = isTrialing ? sub?.trialEnd : sub?.periodEnd;
  const formattedDate = targetDate
    ? new Date(targetDate).toLocaleDateString(locale, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <>
      <WidgetHeader
        title={t("home.widgets.subscription.title")}
        action={
          !loading && !error && value ? (
            <Badge
              variant={
                isCanceling
                  ? "warning"
                  : isTrialing
                    ? "accent"
                    : value.entitled
                      ? "success"
                      : "neutral"
              }
              size="sm"
            >
              {isCanceling
                ? t("home.widgets.subscription.canceling")
                : isTrialing
                  ? t("home.widgets.subscription.trialing")
                  : value.entitled
                    ? t("home.widgets.subscription.active")
                    : t("home.widgets.subscription.inactive")}
            </Badge>
          ) : null
        }
      />
      {loading ? (
        <div className="space-y-3">
          <SkeletonLine className="h-5 w-32" />
          <SkeletonLine className="h-4 w-44" />
          <SkeletonLine className="h-8 w-28 rounded-md" />
        </div>
      ) : error ? (
        <WidgetErrorBox message={t("home.widgets.error")} />
      ) : value?.entitled ? (
        <div className="space-y-3">
          <div className="surface-inset flex items-center justify-between gap-3 px-3 py-2.5">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-m3-text">
                <Sparkles className="h-3.5 w-3.5 text-m3-primary" aria-hidden />
                {t("home.widgets.subscription.planName")}
              </p>
              {sub?.billingInterval ? (
                <p className="text-caption">
                  {sub.billingInterval === "year"
                    ? t("home.widgets.subscription.annual")
                    : t("home.widgets.subscription.monthly")}
                </p>
              ) : null}
            </div>
            {formattedDate ? (
              <span className="inline-flex items-center gap-1 text-caption tabular-nums">
                <CalendarRange className="h-3.5 w-3.5" aria-hidden />
                {formattedDate}
              </span>
            ) : null}
          </div>
          <Link
            href="/account/organization/billing"
            className="inline-flex items-center gap-1 text-xs font-medium text-m3-primary hover:underline"
          >
            {t("home.widgets.subscription.manage")}
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      ) : (
        <WidgetEmptyBox
          icon={<CreditCard className="h-5 w-5" />}
          title={t("home.widgets.subscription.inactive")}
          description={t("home.widgets.subscription.inactiveHint")}
          action={
            <Link
              href="/account/organization/billing"
              className="inline-flex items-center gap-1.5 rounded-md bg-m3-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-m3-primary-dark"
            >
              {t("home.widgets.subscription.manage")}
            </Link>
          }
        />
      )}
    </>
  );
}
