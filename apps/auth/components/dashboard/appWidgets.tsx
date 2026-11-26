"use client";

import { useI18n } from "@/lib/ui/i18n";
import type { WidgetRendererProps } from "@hosanna/dashboard/react";
import { Badge, SuiteAppIcon } from "@hosanna/ui";
import { ChevronRight, LayoutGrid, List, Plus, Search, Star } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  isOpenableApp,
  SkeletonLine,
  toggleFavoriteApp,
  useApps,
  useHomeSettings,
  WidgetEmptyBox,
  WidgetHeader,
  type AppItem,
} from "./shared";

function AppCardLink({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: React.ReactNode;
}) {
  if (href.startsWith("/") && !href.startsWith("//")) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
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
                    <AppCardLink
                      href={app.homeUrl}
                      className="flex min-w-0 flex-1 items-start gap-3 pr-8 text-left"
                    >
                      {content}
                    </AppCardLink>
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
            return (
              <AppCardLink key={app.id} href={app.homeUrl} className="block">
                {tile}
              </AppCardLink>
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

function SingleAppWidget({
  appId,
  instance,
}: {
  appId: string;
  instance: WidgetRendererProps["instance"];
}) {
  const { t } = useI18n();
  const { apps, loading } = useApps();
  const isCompact = instance.w <= 2 && instance.h === 1;

  if (loading) {
    return isCompact ? (
      <div className="flex h-full flex-col items-center justify-center gap-2">
        <SkeletonLine className="h-12 w-12 rounded-2xl" />
        <SkeletonLine className="h-3.5 w-16" />
      </div>
    ) : (
      <div className="flex h-full items-center gap-3">
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
  const categories = app.categories ?? [];

  const compactBody = (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-center">
      <SuiteAppIcon
        logoUrl={app.logoUrl}
        accent={app.accent}
        size="md"
        className={openable ? "transition-transform duration-150 group-hover:scale-105" : ""}
      />
      <span className="line-clamp-1 max-w-full text-xs font-semibold text-m3-text">
        {app.shortName || app.name}
      </span>
    </div>
  );

  const expandedBody = (
    <div className="flex h-full w-full items-center gap-3.5">
      <SuiteAppIcon logoUrl={app.logoUrl} accent={app.accent} size="lg" />
      <div className="min-w-0 flex-1 space-y-1.5">
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
        {categories.length > 0 ? (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {categories.map((category) => (
              <Badge key={category} variant="neutral" size="sm">
                {category}
              </Badge>
            ))}
          </div>
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

  const body = isCompact ? compactBody : expandedBody;

  if (!openable || !app.homeUrl) {
    return <div className="flex h-full w-full items-center">{body}</div>;
  }

  return (
    <AppCardLink href={app.homeUrl} className="group flex h-full w-full items-center">
      {body}
    </AppCardLink>
  );
}

export function AuthAppWidget({ instance }: WidgetRendererProps) {
  return <SingleAppWidget appId="auth" instance={instance} />;
}

export function MusicAppWidget({ instance }: WidgetRendererProps) {
  return <SingleAppWidget appId="music" instance={instance} />;
}
