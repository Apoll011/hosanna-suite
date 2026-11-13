"use client";

import { useAuthUser } from "@/hooks/useAuthUser";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { useI18n } from "@/lib/ui/i18n";
import type { AppSwitcherApp } from "@hosanna/ui";
import { Spinner } from "@hosanna/ui";
import {
  ChevronRight,
  LayoutGrid,
  List,
  Search,
  Star,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

const FAVORITES_KEY = "hosanna_suite_favorite_apps";

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
  const [apps, setApps] = useState<AppSwitcherApp[]>([]);
  const [appsLoading, setAppsLoading] = useState(true);
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
    setAppsLoading(true);
    setAppsError(null);
    try {
      const res = await fetch("/api/suite/apps", { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { apps?: AppSwitcherApp[] };
      setApps(Array.isArray(data.apps) ? data.apps : []);
    } catch {
      setAppsError(t("home.loadError"));
      setApps([]);
    } finally {
      setAppsLoading(false);
    }
  }, [t]);

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
    if (app.homeUrl.startsWith("/") && !app.homeUrl.startsWith("//")) {
      window.location.assign(app.homeUrl);
      return;
    }
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
    <div className="space-y-8 pb-10">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-m3-primary" aria-hidden />
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("home.title")}</h1>
        </div>
        <p className="text-sm text-m3-secondary sm:text-base">{t("home.subtitle")}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-m3-secondary"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("home.searchPlaceholder")}
            className="w-full rounded-xl border border-m3-border/70 bg-m3-card py-2.5 pl-10 pr-3 text-sm outline-none transition-shadow focus:border-m3-primary/50 focus:ring-2 focus:ring-m3-primary/20"
          />
        </label>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-xl border border-m3-border/70 bg-m3-card px-3 py-2.5 text-xs font-semibold text-m3-secondary">
            {t("home.filterAll")}
          </span>
          <div className="inline-flex rounded-xl border border-m3-border/70 bg-m3-card p-1">
            <button
              type="button"
              aria-label={t("home.viewGrid")}
              aria-pressed={view === "grid"}
              className={`rounded-lg p-2 transition-colors ${view === "grid" ? "bg-m3-primary/15 text-m3-primary" : "text-m3-secondary hover:bg-m3-hover"}`}
              onClick={() => setView("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label={t("home.viewList")}
              aria-pressed={view === "list"}
              className={`rounded-lg p-2 transition-colors ${view === "list" ? "bg-m3-primary/15 text-m3-primary" : "text-m3-secondary hover:bg-m3-hover"}`}
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

        {appsLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="md" label={t("common.loading")} />
          </div>
        ) : appsError ? (
          <p className="rounded-xl border border-m3-danger/30 bg-m3-danger/5 px-4 py-3 text-sm text-m3-danger">
            {appsError}
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-m3-secondary">{t("home.empty")}</p>
        ) : (
          <ul
            className={
              view === "grid"
                ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
                : "flex flex-col gap-2"
            }
          >
            {filtered.map((app) => {
              const openable = isOpenable(app);
              const fav = favorites.includes(app.id);
              return (
                <li key={app.id} className="list-none">
                  <div
                    className={`group relative flex h-full gap-3 rounded-2xl border border-m3-border/70 bg-m3-card p-4 shadow-sm transition-colors ${
                      openable
                        ? "hover:border-m3-primary/40 hover:bg-m3-hover/40"
                        : "opacity-70"
                    } ${view === "list" ? "items-center" : "flex-col"}`}
                  >
                    <button
                      type="button"
                      className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-m3-secondary hover:bg-m3-hover hover:text-amber-500"
                      aria-label={fav ? t("home.unfavorite") : t("home.favorite")}
                      onClick={() => toggleFavorite(app.id)}
                    >
                      <Star
                        className={`h-4 w-4 ${fav ? "fill-amber-400 text-amber-500" : ""}`}
                      />
                    </button>

                    <button
                      type="button"
                      disabled={!openable}
                      className={`flex w-full items-start gap-3 pr-8 text-left ${
                        openable ? "cursor-pointer" : "cursor-default"
                      }`}
                      onClick={() => openApp(app)}
                    >
                      <span
                        className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-m3-border/50"
                        style={
                          app.accent
                            ? {
                                backgroundColor: `${app.accent}22`,
                                borderColor: `${app.accent}44`,
                              }
                            : undefined
                        }
                      >
                        <img src={app.logoUrl} alt="" className="h-7 w-7 object-contain" />
                      </span>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold tracking-tight">{app.name}</h3>
                          {openable ? (
                            <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">
                              {t("home.openBadge")}
                            </span>
                          ) : (
                            <span className="rounded-full bg-m3-sidebar px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-m3-secondary">
                              {t("home.comingSoon")}
                            </span>
                          )}
                        </div>
                        {app.description ? (
                          <p className="line-clamp-2 text-sm text-m3-secondary">{app.description}</p>
                        ) : null}
                      </div>
                      {openable ? (
                        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-m3-secondary opacity-0 transition-opacity group-hover:opacity-100" />
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
          {favoriteApps.map((app) => {
            const openable = isOpenable(app);
            const tile = (
              <div
                className={`flex w-24 flex-col items-center gap-2 rounded-2xl border border-m3-border/70 bg-m3-card px-3 py-3 shadow-sm ${
                  openable ? "hover:border-m3-primary/40 hover:bg-m3-hover/40" : "opacity-60"
                }`}
              >
                <span
                  className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-m3-border/50"
                  style={
                    app.accent
                      ? { backgroundColor: `${app.accent}22`, borderColor: `${app.accent}44` }
                      : undefined
                  }
                >
                  <img src={app.logoUrl} alt="" className="h-6 w-6 object-contain" />
                </span>
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
          {favoriteApps.length === 0 ? (
            <p className="text-sm text-m3-secondary">{t("home.favoritesEmpty")}</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
