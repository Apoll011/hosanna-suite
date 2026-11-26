"use client";
import { apiFetch, ensureActiveOrganizationSession } from "@/lib/services/api";
import { homeSettings } from "@/lib/dashboard/settings";
import { loadSuiteApps, localizeSuiteApps, SuiteAppIcon } from "@hosanna/ui";
import type { WidgetRendererProps } from "@hosanna/dashboard/react";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { useI18n } from "@/lib/ui/i18n";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Star } from "lucide-react";

type AppItem = {
  id: string;
  name: string;
  shortName: string;
  homeUrl: string | null;
  status: string;
  accessible?: boolean;
  logoUrl?: string | null;
  accent?: string;
};
const cache = new Map<string, { at: number; value: unknown }>();
let lastOrganizationId: string | null = null;

function useOrganizationData<T>(key: string, path: string) {
  const { organization } = useActiveOrganization();
  const [state, setState] = useState<{
    organizationId: string | null;
    value: T | null;
    error: boolean;
    loading: boolean;
  }>({ organizationId: null, value: null, error: false, loading: true });
  useEffect(() => {
    let active = true;
    const orgId = organization?.id;
    if (!orgId) {
      setState({ organizationId: null, value: null, error: false, loading: false });
      return;
    }
    if (lastOrganizationId !== orgId) {
      cache.clear();
      lastOrganizationId = orgId;
    }
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
  }, [organization?.id, key, path]);
  return state.organizationId === (organization?.id ?? null)
    ? state
    : { organizationId: organization?.id ?? null, value: null, error: false, loading: true };
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

function WidgetTitle({ children }: { children: string }) {
  return <h2 className="mb-3 text-title">{children}</h2>;
}

export function AppLauncherWidget(_: WidgetRendererProps) {
  const { t } = useI18n();
  const { apps, loading } = useApps();
  const settings = useHomeSettings();
  if (loading) return <p className="text-muted">{t("common.loading")}</p>;
  const available = apps.filter(
    (app) => app.status === "live" && app.accessible !== false && app.homeUrl,
  );
  return (
    <>
      <WidgetTitle>{t("home.widgets.launcher.title")}</WidgetTitle>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {available.map((app) => {
          const favorite = settings.favorites.includes(app.id);
          return (
            <li
              key={app.id}
              className="flex min-w-0 items-center rounded-md border border-m3-border hover:bg-m3-hover"
            >
              <a
                href={app.homeUrl ?? undefined}
                className="flex min-h-12 min-w-0 flex-1 items-center gap-2 px-3 py-2 text-sm"
              >
                <SuiteAppIcon logoUrl={app.logoUrl} accent={app.accent} size="sm" />
                {app.shortName || app.name}
              </a>
              <button
                type="button"
                className="min-h-11 min-w-11 text-m3-secondary hover:text-m3-primary"
                aria-label={
                  favorite ? t("home.widgets.favorites.remove") : t("home.widgets.favorites.add")
                }
                onClick={() =>
                  homeSettings.set({
                    favorites: favorite
                      ? settings.favorites.filter((id) => id !== app.id)
                      : [...settings.favorites, app.id],
                  })
                }
              >
                <Star
                  className="mx-auto h-4 w-4"
                  fill={favorite ? "currentColor" : "none"}
                  aria-hidden
                />
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export function FavoritesWidget(_: WidgetRendererProps) {
  const { t } = useI18n();
  const { apps, loading } = useApps();
  const favorites = useHomeSettings().favorites;
  if (loading) return <p className="text-muted">{t("common.loading")}</p>;
  const items = favorites
    .map((id) => apps.find((app) => app.id === id))
    .filter((app): app is AppItem => Boolean(app?.homeUrl));
  return (
    <>
      <WidgetTitle>{t("home.widgets.favorites.title")}</WidgetTitle>
      {items.length ? (
        <ul className="space-y-2">
          {items.map((app) => (
            <li key={app.id}>
              <a
                href={app.homeUrl ?? undefined}
                className="block rounded-md px-2 py-2 text-sm hover:bg-m3-hover"
              >
                {app.name}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted">{t("home.widgets.favorites.empty")}</p>
      )}
    </>
  );
}

type Service = { id: string; name: string; date: string };
export function NextServiceWidget(_: WidgetRendererProps) {
  const { t } = useI18n();
  const { value, loading, error } = useOrganizationData<Service[]>(
    "services",
    "/services?metadataOnly=true",
  );
  const next = (value ?? [])
    .filter((service) => new Date(service.date).getTime() >= Date.now())
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  return (
    <>
      <WidgetTitle>{t("home.widgets.nextService.title")}</WidgetTitle>
      {loading ? (
        <p className="text-muted">{t("common.loading")}</p>
      ) : error ? (
        <p role="alert" className="text-sm text-m3-danger">
          {t("home.widgets.error")}
        </p>
      ) : next ? (
        <>
          <p className="text-body font-medium">{next.name}</p>
          <p className="text-muted">{new Date(next.date).toLocaleDateString()}</p>
        </>
      ) : (
        <p className="text-muted">{t("home.widgets.nextService.empty")}</p>
      )}
    </>
  );
}

type SongResponse = { total: number };
export function LibrarySummaryWidget(_: WidgetRendererProps) {
  const { t } = useI18n();
  const { value, loading, error } = useOrganizationData<SongResponse>(
    "song-count",
    "/songs?limit=1",
  );
  return (
    <>
      <WidgetTitle>{t("home.widgets.library.title")}</WidgetTitle>
      {loading ? (
        <p className="text-muted">{t("common.loading")}</p>
      ) : error ? (
        <p role="alert" className="text-sm text-m3-danger">
          {t("home.widgets.error")}
        </p>
      ) : (
        <p className="tabular-nums text-2xl font-semibold">
          {value?.total ?? 0}
          <span className="ml-2 text-sm font-normal text-m3-secondary">
            {t("home.widgets.library.songs")}
          </span>
        </p>
      )}
    </>
  );
}

type Entitlement = { entitled: boolean };
export function SubscriptionWidget(_: WidgetRendererProps) {
  const { t } = useI18n();
  const { organization } = useActiveOrganization();
  const [state, setState] = useState<{
    organizationId: string | null;
    value: Entitlement | null;
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
    if (lastOrganizationId !== orgId) {
      cache.clear();
      lastOrganizationId = orgId;
    }
    const cacheKey = orgId + ":subscription";
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.at < 60_000) {
      setState({
        organizationId: orgId,
        value: cached.value as Entitlement,
        loading: false,
        error: false,
      });
      return;
    }
    setState({ organizationId: orgId, value: null, loading: true, error: false });
    void ensureActiveOrganizationSession(orgId)
      .then(() => fetch("/api/billing/entitlement", { credentials: "include" }))
      .then(async (response) => {
        if (!response.ok) throw new Error("Request failed");
        return (await response.json()) as Entitlement;
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
  return (
    <>
      <WidgetTitle>{t("home.widgets.subscription.title")}</WidgetTitle>
      {loading ? (
        <p className="text-muted">{t("common.loading")}</p>
      ) : error ? (
        <p role="alert" className="text-sm text-m3-danger">
          {t("home.widgets.error")}
        </p>
      ) : (
        <>
          <p className="text-body">
            {value?.entitled
              ? t("home.widgets.subscription.active")
              : t("home.widgets.subscription.inactive")}
          </p>
          <Link
            href="/account/organization/billing"
            className="mt-3 inline-block text-sm text-m3-primary"
          >
            {t("home.widgets.subscription.manage")}
          </Link>
        </>
      )}
    </>
  );
}
