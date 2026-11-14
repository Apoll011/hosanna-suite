"use client";

import { useAuthUser } from "@/hooks/useAuthUser";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { useI18n } from "@/lib/ui/i18n";
import type { AppSwitcherApp } from "@hosanna/ui";
import {
  loadSuiteApps,
  localizeSuiteApps,
  peekSuiteAppsCache,
  Spinner,
  SuiteAppIcon,
} from "@hosanna/ui";
import { ChevronRight, LayoutGrid, List, Plus, Search, Star } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

const FAVORITES_KEY = "hosanna_suite_favorite_apps";
const APPS_URL = "/api/suite/apps";

type ViewMode = "grid" | "list";

function readFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeFavorites(ids: string[]) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
}

function isOpenable(app: AppSwitcherApp): boolean {
  if (app.status === "coming_soon") return false;
  if (app.accessible === false) return false;
  return Boolean(app.homeUrl);
}

export function HomePage() {
  const { t } = useI18n();
  const { user, isLoading: userLoading } = useAuthUser({
    loginRedirect: "/login?redirect=/home",
  });
  const { organization, organizations, isLoading: orgLoading } = useActiveOrganization();
  const translate = useCallback((key: string) => t(key as Parameters<typeof t>[0]), [t]);

  const [apps, setApps] = useState<AppSwitcherApp[]>(() => {
    const cached = peekSuiteAppsCache(APPS_URL);
    return cached ? localizeSuiteApps(cached, translate) : [];
  });
  const [appsLoading, setAppsLoading] = useState(() => !peekSuiteAppsCache(APPS_URL)?.length);
  const [appsError, setAppsError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("grid");
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    setFavorites(readFavorites());
  }, []);

  useEffect(() => {
    if (orgLoading) return;
    if (!organization && organizations.length === 0) {
      window.location.assign("/onboarding");
    }
  }, [orgLoading, organization, organizations.length]);

  const loadApps = useCallback(async () => {
    const cached = peekSuiteAppsCache(APPS_URL);
    if (cached?.length) {
      setApps(localizeSuiteApps(cached, translate));
      setAppsLoading(false);
    } else {
      setAppsLoading(true);
    }
    setAppsError(null);
    try {
      const list = await loadSuiteApps(APPS_URL);
      setApps(localizeSuiteApps(list, translate));
    } catch {
      if (!peekSuiteAppsCache(APPS_URL)?.length) {
        setAppsError(t("home.loadError"));
        setApps([]);
      }
    } finally {
      setAppsLoading(false);
    }
  }, [t, translate]);

  useEffect(() => {
    void loadApps();
  }, [loadApps, organization?.id]);

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

  const favoriteApps = useMemo(
    () => favorites.map((id) => apps.find((a) => a.id === id)).filter(Boolean) as AppSwitcherApp[],
    [favorites, apps],
  );

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      writeFavorites(next);
      return next;
    });
  };

  const openApp = (app: AppSwitcherApp) => {
    if (!isOpenable(app) || !app.homeUrl) return;
    window.location.assign(app.homeUrl);
  };

  if ((userLoading && !user) || (orgLoading && !organization && organizations.length === 0)) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="md" label={t("common.loading")} />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-10 pb-12">
      <div className="space-y-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-m3-primary/12 text-m3-primary shadow-sm ring-1 ring-m3-primary/15">
            <LayoutGrid className="h-4.5 w-4.5" aria-hidden />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("home.title")}</h1>
        </div>
        <p className="max-w-2xl text-sm text-m3-secondary sm:text-base">{t("home.subtitle")}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-m3-secondary"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("home.searchPlaceholder")}
            className="w-full rounded-2xl border border-m3-border/60 bg-m3-card/90 py-3 pl-11 pr-4 text-sm shadow-sm outline-none transition-[border,box-shadow] focus:border-m3-primary/40 focus:ring-2 focus:ring-m3-primary/15"
          />
        </label>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-2xl border border-m3-border/60 bg-m3-card px-3.5 py-3 text-xs font-semibold text-m3-secondary shadow-sm">
            {t("home.filterAll")}
          </span>
          <div className="inline-flex rounded-2xl border border-m3-border/60 bg-m3-card p-1 shadow-sm">
            <button
              type="button"
              aria-label={t("home.viewGrid")}
              aria-pressed={view === "grid"}
              className={`rounded-xl p-2.5 transition-colors ${view === "grid" ? "bg-m3-primary/15 text-m3-primary" : "text-m3-secondary hover:bg-m3-hover"}`}
              onClick={() => setView("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label={t("home.viewList")}
              aria-pressed={view === "list"}
              className={`rounded-xl p-2.5 transition-colors ${view === "list" ? "bg-m3-primary/15 text-m3-primary" : "text-m3-secondary hover:bg-m3-hover"}`}
              onClick={() => setView("list")}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{t("home.catalogTitle")}</h2>
          <p className="text-sm text-m3-secondary">{t("home.catalogSubtitle")}</p>
        </div>

        {appsLoading && apps.length === 0 ? (
          <div className="flex justify-center py-12">
            <Spinner size="md" label={t("common.loading")} />
          </div>
        ) : appsError && apps.length === 0 ? (
          <p className="rounded-2xl border border-m3-danger/30 bg-m3-danger/5 px-4 py-3 text-sm text-m3-danger">
            {appsError}
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-m3-secondary">{t("home.empty")}</p>
        ) : (
          <ul
            className={
              view === "grid"
                ? "grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3"
                : "flex flex-col gap-2.5"
            }
          >
            {filtered.map((app) => {
              const openable = isOpenable(app);
              const fav = favorites.includes(app.id);
              return (
                <li key={app.id} className="list-none">
                  <div
                    className={`group relative flex h-full gap-3 rounded-3xl border border-m3-border/50 bg-m3-card p-4 shadow-[0_8px_30px_-18px_rgb(0_0_0_/0.35)] transition-[transform,box-shadow,border-color] ${
                      openable
                        ? "hover:-translate-y-0.5 hover:border-m3-primary/25 hover:shadow-[0_16px_40px_-20px_rgb(0_0_0_/0.4)]"
                        : "opacity-75"
                    } ${view === "list" ? "items-center" : ""}`}
                  >
                    <button
                      type="button"
                      className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-m3-secondary transition-colors hover:bg-m3-hover hover:text-amber-500"
                      aria-label={fav ? t("home.unfavorite") : t("home.favorite")}
                      onClick={() => toggleFavorite(app.id)}
                    >
                      <Star className={`h-4 w-4 ${fav ? "fill-amber-400 text-amber-500" : ""}`} />
                    </button>

                    <button
                      type="button"
                      disabled={!openable}
                      className={`flex w-full items-start gap-3.5 pr-8 text-left ${
                        openable ? "cursor-pointer" : "cursor-default"
                      }`}
                      onClick={() => openApp(app)}
                    >
                      <SuiteAppIcon logoUrl={app.logoUrl} accent={app.accent} size="lg" />
                      <div className="min-w-0 flex-1 space-y-1.5 pt-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold tracking-tight">{app.name}</h3>
                          {openable ? (
                            <span className="rounded-full bg-sky-500/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-700 dark:text-sky-300">
                              {t("home.openBadge")}
                            </span>
                          ) : (
                            <span className="rounded-full bg-m3-sidebar px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-m3-secondary">
                              {t("suite.comingSoon")}
                            </span>
                          )}
                        </div>
                        {app.description ? (
                          <p className="line-clamp-2 text-sm leading-snug text-m3-secondary">
                            {app.description}
                          </p>
                        ) : null}
                      </div>
                      {openable ? (
                        <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-m3-secondary opacity-0 transition-opacity group-hover:opacity-100" />
                      ) : null}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{t("home.favoritesTitle")}</h2>
          <p className="text-sm text-m3-secondary">{t("home.favoritesSubtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {favoriteApps.length === 0 ? (
            <p className="w-full text-sm text-m3-secondary">{t("home.favoritesEmpty")}</p>
          ) : null}
          {favoriteApps.map((app) => {
            const openable = isOpenable(app);
            const tile = (
              <div
                className={`flex w-28 flex-col items-center gap-2.5 rounded-3xl border border-m3-border/50 bg-m3-card px-3 py-3.5 shadow-[0_8px_24px_-16px_rgb(0_0_0_/0.35)] transition-[transform,border-color] ${
                  openable ? "hover:-translate-y-0.5 hover:border-m3-primary/30" : "opacity-60"
                }`}
              >
                <SuiteAppIcon logoUrl={app.logoUrl} accent={app.accent} size="sm" />
                <span className="line-clamp-2 text-center text-[11px] font-semibold leading-tight">
                  {app.shortName}
                </span>
              </div>
            );

            if (!openable || !app.homeUrl) {
              return (
                <div key={app.id} aria-disabled>
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
              <button key={app.id} type="button" onClick={() => openApp(app)}>
                {tile}
              </button>
            );
          })}
          <button
            type="button"
            className="flex w-28 flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-m3-border/80 bg-m3-card/40 px-3 py-3.5 text-m3-secondary transition-colors hover:border-m3-primary/40 hover:bg-m3-hover/40 hover:text-m3-primary"
            onClick={() => {
              const first = apps.find((a) => !favorites.includes(a.id));
              if (first) toggleFavorite(first.id);
            }}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-dashed border-current/40">
              <Plus className="h-4 w-4" />
            </span>
            <span className="text-center text-[11px] font-semibold leading-tight">
              {t("home.addShortcut")}
            </span>
          </button>
        </div>
      </section>
    </div>
  );
}
