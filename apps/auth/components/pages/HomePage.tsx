"use client";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { useAuthUser } from "@/hooks/useAuthUser";
import { authDashboardRegistry, authDashboardRenderers } from "@/components/dashboard/registry";
import { WidgetGalleryModal } from "@/components/dashboard/WidgetGalleryModal";
import { migrateLegacyFavorites, homeSettings } from "@/lib/dashboard/settings";
import { useI18n } from "@/lib/ui/i18n";
import {
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
import { Plus } from "lucide-react";
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
  const [galleryOpen, setGalleryOpen] = useState(false);
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
    setGalleryOpen(false);
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
      setEditing(true);
    }
  }, [layout]);
  const cancelEditing = () => {
    setDraft(null);
    setGalleryOpen(false);
    setEditing(false);
  };
  const saveEditing = () => {
    if (!orgId || !draft) return;
    const normalized = normalizeLayout(draft, authDashboardRegistry);
    setLayout(normalized);
    homeSettings.set({ layouts: { ...homeSettings.get().layouts, [orgId]: normalized } });
    setDraft(null);
    setGalleryOpen(false);
    setEditing(false);
  };
  const resetEditing = () => setDraft(buildDefaultLayout(context, authDashboardRegistry));
  const handleRemove = useCallback((instanceId: string) => {
    setDraft((current) => (current ? removeWidget(current, instanceId) : current));
  }, []);
  const handleAddWidget = useCallback((widgetId: string) => {
    setDraft((current) =>
      current
        ? addWidget(current, widgetId, authDashboardRegistry, widgetId + ":" + crypto.randomUUID())
        : current,
    );
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
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setGalleryOpen(true)}
              icon={<Plus className="h-4 w-4" aria-hidden />}
            >
              {t("home.dashboard.gallery")}
            </Button>
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
        <div className="min-w-0 w-full">
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
      )}

      <WidgetGalleryModal
        isOpen={editing && galleryOpen}
        onClose={() => setGalleryOpen(false)}
        widgets={gallery}
        draft={draft}
        apps={apps}
        onAddWidget={handleAddWidget}
      />
    </main>
  );
}
