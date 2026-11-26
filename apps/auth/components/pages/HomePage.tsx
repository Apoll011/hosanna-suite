"use client";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { useAuthUser } from "@/hooks/useAuthUser";
import { authDashboardRegistry, authDashboardRenderers } from "@/components/dashboard/registry";
import { migrateLegacyFavorites, homeSettings } from "@/lib/dashboard/settings";
import { useI18n } from "@/lib/ui/i18n";
import {
  Button,
  loadSuiteApps,
  peekSuiteAppsCache,
  Spinner,
  type SuiteCatalogApp,
} from "@hosanna/ui";
import { Dashboard, listRenderableWidgets, WidgetConfiguration } from "@hosanna/dashboard/react";
import {
  addWidget,
  buildDefaultLayout,
  isWidgetEligible,
  mergeNewEligibleWidgets,
  normalizeLayout,
  removeWidget,
  updateWidget,
  type DashboardLayout,
  type WidgetInstance,
} from "@hosanna/dashboard/core";
import { resolveEffectivePermissions } from "@hosanna/auth";
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
  const [configuring, setConfiguring] = useState<string | null>(null);
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
    setConfiguring(null);
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
      setEditing(true);
    }
  }, [layout]);
  const cancelEditing = () => {
    setDraft(null);
    setEditing(false);
  };
  const saveEditing = () => {
    if (!orgId || !draft) return;
    const normalized = normalizeLayout(draft, authDashboardRegistry);
    setLayout(normalized);
    homeSettings.set({ layouts: { ...homeSettings.get().layouts, [orgId]: normalized } });
    setDraft(null);
    setEditing(false);
  };
  const resetEditing = () => setDraft(buildDefaultLayout(context, authDashboardRegistry));
  const update = (instanceId: string, patch: Partial<WidgetInstance>) => {
    setDraft((current) =>
      current ? updateWidget(current, instanceId, patch, authDashboardRegistry) : current,
    );
  };
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
  const groups = [...new Set(gallery.map((definition) => definition.app))];

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
          <div className="flex gap-2">
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
        <div className="space-y-6">
          {editing ? (
            <section className="surface p-4 sm:p-5">
              <h2 className="text-title">{t("home.dashboard.gallery")}</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {groups.map((appId) => (
                  <div key={appId} className="space-y-2">
                    <h3 className="text-label uppercase">
                      {t(("suite.apps." + appId + ".name") as Parameters<typeof t>[0])}
                    </h3>
                    {gallery
                      .filter((widget) => widget.app === appId)
                      .map((widget) => {
                        const count =
                          draft?.items.filter((item) => item.widget === widget.id).length ?? 0;
                        const unavailable = widget.singleton && count > 0;
                        return (
                          <div
                            key={widget.id}
                            className="flex items-center justify-between gap-2 rounded-md border border-m3-border px-3 py-2"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium">
                                {t(widget.title as Parameters<typeof t>[0])}
                              </p>
                              <p className="text-caption">
                                {t(widget.description as Parameters<typeof t>[0])}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
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
                            >
                              {t("home.dashboard.add")}
                            </Button>
                          </div>
                        );
                      })}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {editing && !mobile ? (
            <GridstackAdapter
              layout={renderLayout}
              registry={authDashboardRegistry}
              renderers={authDashboardRenderers}
              onChange={setDraft}
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
              onRemove={(instanceId) =>
                setDraft((current) => (current ? removeWidget(current, instanceId) : current))
              }
            />
          )}

          {editing ? (
            <section aria-label={t("home.dashboard.keyboardControls")} className="space-y-3">
              <h2 className="text-title">{t("home.dashboard.keyboardControls")}</h2>
              {draft?.items
                .filter((item) => {
                  const definition = authDashboardRegistry.get(item.widget);
                  return definition && isWidgetEligible(definition, context);
                })
                .map((item) => {
                  const definition = authDashboardRegistry.get(item.widget);
                  if (configuring !== item.instanceId || !definition?.config) return null;
                  return (
                    <div key={item.instanceId} className="surface p-4">
                      <h3 className="mb-3 text-sm font-semibold">
                        {t("home.dashboard.configure")}:{" "}
                        {t(definition.title as Parameters<typeof t>[0])}
                      </h3>
                      <WidgetConfiguration
                        definition={definition.config}
                        value={item.config ?? definition.config.defaults ?? {}}
                        label={(key) => t(key as Parameters<typeof t>[0])}
                        onChange={(config) =>
                          update(item.instanceId, {
                            config,
                            configVersion: definition.config?.version ?? 0,
                          })
                        }
                      />
                    </div>
                  );
                })}
              {draft?.items
                .filter((item) => {
                  const definition = authDashboardRegistry.get(item.widget);
                  return definition && isWidgetEligible(definition, context);
                })
                .map((item) => {
                  const definition = authDashboardRegistry.get(item.widget);
                  if (!definition) return null;
                  return (
                    <div
                      key={item.instanceId}
                      className="flex flex-wrap items-center gap-2 rounded-md border border-m3-border p-2"
                    >
                      <span className="min-w-28 flex-1 text-sm">
                        {t(definition.title as Parameters<typeof t>[0])}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={t("home.dashboard.moveLeft")}
                        onClick={() => update(item.instanceId, { x: item.x - 1 })}
                      >
                        ←
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={t("home.dashboard.moveRight")}
                        onClick={() => update(item.instanceId, { x: item.x + 1 })}
                      >
                        →
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={t("home.dashboard.moveUp")}
                        onClick={() => update(item.instanceId, { y: item.y - 1 })}
                      >
                        ↑
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={t("home.dashboard.moveDown")}
                        onClick={() => update(item.instanceId, { y: item.y + 1 })}
                      >
                        ↓
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={t("home.dashboard.smaller")}
                        onClick={() =>
                          update(item.instanceId, {
                            w: Math.max(definition.minSize.w, item.w - 1),
                            h: Math.max(definition.minSize.h, item.h - 1),
                          })
                        }
                      >
                        −
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={t("home.dashboard.larger")}
                        onClick={() =>
                          update(item.instanceId, {
                            w: Math.min(definition.maxSize?.w ?? 12, item.w + 1),
                            h: Math.min(definition.maxSize?.h ?? 20, item.h + 1),
                          })
                        }
                      >
                        +
                      </Button>
                      {definition.config?.schema &&
                      Object.keys(definition.config.schema.fields).length > 0 ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setConfiguring((current) =>
                              current === item.instanceId ? null : item.instanceId,
                            )
                          }
                        >
                          {t("home.dashboard.configure")}
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setDraft((current) =>
                            current ? removeWidget(current, item.instanceId) : current,
                          )
                        }
                      >
                        {t("home.dashboard.remove")}
                      </Button>
                    </div>
                  );
                })}
            </section>
          ) : null}
        </div>
      )}
    </main>
  );
}
