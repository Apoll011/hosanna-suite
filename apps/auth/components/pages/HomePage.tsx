"use client";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { useAuthUser } from "@/hooks/useAuthUser";
import { authDashboardRegistry, authDashboardRenderers } from "@/components/dashboard/registry";
import { migrateLegacyFavorites, homeSettings } from "@/lib/dashboard/settings";
import { useI18n } from "@/lib/ui/i18n";
import {
  Badge,
  Button,
  loadSuiteApps,
  peekSuiteAppsCache,
  Spinner,
  type SuiteCatalogApp,
} from "@hosanna/ui";
import { Dashboard, listRenderableWidgets } from "@hosanna/dashboard/react";
import {
  addWidget,
  buildDefaultLayout,
  isWidgetEligible,
  mergeNewEligibleWidgets,
  normalizeLayout,
  removeWidget,
  type DashboardLayout,
} from "@hosanna/dashboard/core";
import { resolveEffectivePermissions } from "@hosanna/auth";
import { Check, ChevronDown, ChevronRight, Plus, Search } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";

const GridstackAdapter = dynamic(
  () => import("@hosanna/dashboard/gridstack").then((module) => module.GridstackAdapter),
  { ssr: false },
);
const APPS_URL = "/api/suite/apps";

export function HomePage() {
  const { t } = useI18n();
  const { user, isLoading: userLoading } = useAuthUser({ loginRedirect: "/login?redirect=/home" });
  const {
    organization,
    organizations,
    activeRole,
    isLoading: orgLoading,
  } = useActiveOrganization();
  const settings = useSyncExternalStore(homeSettings.subscribe, homeSettings.get, homeSettings.get);
  const [apps, setApps] = useState<SuiteCatalogApp[]>([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [layout, setLayout] = useState<DashboardLayout | null>(null);
  const [draft, setDraft] = useState<DashboardLayout | null>(null);
  const [editing, setEditing] = useState(false);
  const [widgetQuery, setWidgetQuery] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [mobile, setMobile] = useState(false);
  const [error, setError] = useState(false);
  const [catalogRevision, setCatalogRevision] = useState(0);
  const orgId = organization?.id ?? null;
  const permissionResolution = useMemo(
    () => resolveEffectivePermissions({ orgRole: activeRole }),
    [activeRole],
  );
  const context = useMemo(
    () => ({
      permissions: permissionResolution.allowed,
      orgRole: activeRole,
      apps: apps.map(({ id, status, accessible }) => ({ id, status, accessible })),
    }),
    [permissionResolution.allowed, activeRole, apps],
  );

  useEffect(() => {
    migrateLegacyFavorites();
  }, []);

  useEffect(() => {
    const update = () => setMobile(window.matchMedia("(max-width: 767px)").matches);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (orgLoading) return;
    if (!organization && organizations.length === 0) window.location.assign("/onboarding");
  }, [orgLoading, organization, organizations.length]);

  useEffect(() => {
    if (!orgId) return;
    let active = true;
    setApps([]);
    setAppsLoading(true);
    setError(false);
    setLayout(null);
    setDraft(null);
    setEditing(false);
    const scopedUrl = APPS_URL + "?organizationId=" + encodeURIComponent(orgId);
    const cached = peekSuiteAppsCache(scopedUrl);
    if (cached && active) setApps(cached);
    void loadSuiteApps(scopedUrl, { force: !cached })
      .then((next) => {
        if (active) {
          setApps(next);
          setError(next.length === 0);
        }
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setAppsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [orgId, catalogRevision]);

  useEffect(() => {
    if (!orgId || appsLoading || apps.length === 0) return;
    const saved = settings.layouts[orgId];
    const initial = saved
      ? mergeNewEligibleWidgets(
          normalizeLayout(saved, authDashboardRegistry),
          context,
          authDashboardRegistry,
        )
      : buildDefaultLayout(context, authDashboardRegistry);
    setLayout(initial);
    if (!saved || JSON.stringify(saved) !== JSON.stringify(initial)) {
      homeSettings.set({ layouts: { ...settings.layouts, [orgId]: initial } });
    }
  }, [orgId, appsLoading, apps, context, settings.layouts]);

  const beginEditing = useCallback(() => {
    if (layout) {
      setDraft(structuredClone(layout));
      setWidgetQuery("");
      setEditing(true);
    }
  }, [layout]);
  const cancelEditing = () => {
    setDraft(null);
    setWidgetQuery("");
    setEditing(false);
  };
  const saveEditing = () => {
    if (!orgId || !draft) return;
    const normalized = normalizeLayout(draft, authDashboardRegistry);
    setLayout(normalized);
    homeSettings.set({ layouts: { ...homeSettings.get().layouts, [orgId]: normalized } });
    setDraft(null);
    setWidgetQuery("");
    setEditing(false);
  };
  const resetEditing = () => setDraft(buildDefaultLayout(context, authDashboardRegistry));
  const handleRemove = useCallback((instanceId: string) => {
    setDraft((current) => (current ? removeWidget(current, instanceId) : current));
  }, []);

  const currentLayout = editing ? draft : layout;
  const renderLayout = currentLayout
    ? {
        ...currentLayout,
        items: currentLayout.items.filter((item) => {
          const definition = authDashboardRegistry.get(item.widget);
          return !definition || isWidgetEligible(definition, context);
        }),
      }
    : null;
  const usableWidgets = listRenderableWidgets(authDashboardRegistry, authDashboardRenderers);
  const gallery = usableWidgets.filter((definition) => isWidgetEligible(definition, context));
  const normalizedQuery = widgetQuery.trim().toLowerCase();
  const filteredGallery = useMemo(() => {
    if (!normalizedQuery) return gallery;
    return gallery.filter((widget) => {
      const title = t(widget.title as Parameters<typeof t>[0]).toLowerCase();
      const description = t(widget.description as Parameters<typeof t>[0]).toLowerCase();
      const appName = t(
        ("suite.apps." + widget.app + ".name") as Parameters<typeof t>[0],
      ).toLowerCase();
      return (
        title.includes(normalizedQuery) ||
        description.includes(normalizedQuery) ||
        appName.includes(normalizedQuery)
      );
    });
  }, [gallery, normalizedQuery, t]);
  const groups = [...new Set(filteredGallery.map((definition) => definition.app))];

  if ((userLoading && !user) || (orgLoading && !organization)) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="md" label={t("common.loading")} />
      </div>
    );
  }
  if (!user || !orgId) return null;
  if (!appsLoading && error && !layout) {
    return (
      <main className="space-y-4">
        <h1 className="text-display">{t("home.title")}</h1>
        <p role="alert" className="text-sm text-m3-danger">
          {t("home.loadError")}
        </p>
        <Button variant="outline" onClick={() => setCatalogRevision((value) => value + 1)}>
          {t("home.dashboard.retry")}
        </Button>
      </main>
    );
  }

  return (
    <main className="space-y-6 pb-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-display">{t("home.title")}</h1>
          <p className="mt-1 text-muted">{organization?.name}</p>
        </div>
        {editing ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={resetEditing}>
              {t("home.dashboard.reset")}
            </Button>
            <Button variant="outline" onClick={cancelEditing}>
              {t("home.dashboard.cancel")}
            </Button>
            <Button onClick={saveEditing}>{t("home.dashboard.done")}</Button>
          </div>
        ) : (
          <Button variant="outline" onClick={beginEditing}>
            {t("home.dashboard.customize")}
          </Button>
        )}
      </header>

      {error ? (
        <p role="alert" className="text-sm text-m3-danger">
          {t("home.loadError")}
        </p>
      ) : null}
      {appsLoading || !renderLayout ? (
        <div className="flex justify-center py-12">
          <Spinner size="md" label={t("common.loading")} />
        </div>
      ) : (
        <div className={editing ? "flex flex-col items-start gap-6 lg:flex-row" : "space-y-6"}>
          {editing ? (
            <aside
              aria-label={t("home.dashboard.gallery")}
              className="surface w-full shrink-0 space-y-3 p-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-7rem)] lg:w-80 lg:overflow-y-auto"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-title">{t("home.dashboard.gallery")}</h2>
                <Badge variant="neutral" size="sm" className="tabular-nums">
                  {filteredGallery.length}
                </Badge>
              </div>
              <label className="relative block">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-m3-secondary"
                  aria-hidden
                />
                <input
                  type="search"
                  value={widgetQuery}
                  onChange={(event) => setWidgetQuery(event.target.value)}
                  placeholder={t("home.dashboard.searchWidgets")}
                  className="h-10 w-full rounded-md border border-m3-border bg-m3-card pl-9 pr-3 text-sm outline-none transition-colors focus:border-m3-primary focus:ring-2 focus:ring-m3-primary/20"
                />
              </label>

              {groups.length === 0 ? (
                <p className="rounded-md border border-dashed border-m3-border bg-m3-sidebar/40 px-3 py-5 text-center text-caption">
                  {t("home.dashboard.noMatchingWidgets")}
                </p>
              ) : (
                <div className="space-y-2.5">
                  {groups.map((appId) => {
                    const groupWidgets = filteredGallery.filter((widget) => widget.app === appId);
                    const isCollapsed = !normalizedQuery && Boolean(collapsedGroups[appId]);
                    return (
                      <div
                        key={appId}
                        className="rounded-md border border-m3-border/70 bg-m3-sidebar/30"
                      >
                        <button
                          type="button"
                          aria-expanded={!isCollapsed}
                          onClick={() =>
                            setCollapsedGroups((prev) => ({
                              ...prev,
                              [appId]: !prev[appId],
                            }))
                          }
                          className="flex min-h-10 w-full items-center justify-between gap-2 px-3 py-2 text-left transition-colors hover:bg-m3-hover/60"
                        >
                          <span className="flex items-center gap-2 text-label uppercase">
                            {isCollapsed ? (
                              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                            )}
                            {t(("suite.apps." + appId + ".name") as Parameters<typeof t>[0])}
                          </span>
                          <Badge variant="neutral" size="sm" className="tabular-nums">
                            {groupWidgets.length}
                          </Badge>
                        </button>
                        {!isCollapsed ? (
                          <div className="space-y-2 border-t border-m3-border/60 p-2">
                            {groupWidgets.map((widget) => {
                              const count =
                                draft?.items.filter((item) => item.widget === widget.id).length ??
                                0;
                              const unavailable = widget.singleton && count > 0;
                              return (
                                <div
                                  key={widget.id}
                                  className="flex items-center justify-between gap-2 rounded-md border border-m3-border bg-m3-card px-3 py-2"
                                >
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-m3-text">
                                      {t(widget.title as Parameters<typeof t>[0])}
                                    </p>
                                    <p className="line-clamp-2 text-caption">
                                      {t(widget.description as Parameters<typeof t>[0])}
                                    </p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant={unavailable ? "ghost" : "outline"}
                                    disabled={unavailable}
                                    onClick={() =>
                                      setDraft((current) =>
                                        current
                                          ? addWidget(
                                              current,
                                              widget.id,
                                              authDashboardRegistry,
                                              widget.id + ":" + crypto.randomUUID(),
                                            )
                                          : current,
                                      )
                                    }
                                    aria-label={
                                      t("home.dashboard.add") +
                                      " " +
                                      t(widget.title as Parameters<typeof t>[0])
                                    }
                                  >
                                    {unavailable ? (
                                      <Check className="h-3.5 w-3.5" aria-hidden />
                                    ) : (
                                      <Plus className="h-3.5 w-3.5" aria-hidden />
                                    )}
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </aside>
          ) : null}

          <div className="min-w-0 w-full flex-1">
            {editing && !mobile ? (
              <GridstackAdapter
                layout={renderLayout}
                registry={authDashboardRegistry}
                renderers={authDashboardRenderers}
                onChange={setDraft}
                onRemove={handleRemove}
                removeLabel={t("home.dashboard.remove")}
                getTitle={(definition) => t(definition.title as Parameters<typeof t>[0])}
              />
            ) : (
              <Dashboard
                layout={renderLayout}
                registry={authDashboardRegistry}
                renderers={authDashboardRenderers}
                editable={editing}
                removeLabel={t("home.dashboard.remove")}
                errorLabel={t("home.widgets.error")}
                getTitle={(definition) => t(definition.title as Parameters<typeof t>[0])}
                onRemove={handleRemove}
              />
            )}
          </div>
        </div>
      )}
    </main>
  );
}
