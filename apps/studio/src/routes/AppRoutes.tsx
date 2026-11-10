/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Spinner, usePreloadPermissions } from "@hosanna/ui";
import { useI18n } from "@/src/lib/i18n";
import React, { Suspense, useEffect } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Navigate, Outlet, Route, Routes, useLocation, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { isDemoMode } from "../demo/index";
import { MainLayout } from "../layouts/MainLayout";

import { posthog } from "../lib/posthog";
import { ExternalAuthRedirect } from "../components/ExternalAuthRedirect";
import { ProtectedRoute } from "./ProtectedRoute";

const PageLoader = () => {
  const { t } = useI18n();
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-m3-bg">
      <Spinner size="lg" label={t("common.loading")} />
    </div>
  );
};

import {
  AgendaPage,
  AnalyticsPage,
  CollectionDetailPage,
  CollectionsPage,
  DemoPage,
  FoldersPage,
  ServiceDetailPage,
  ServicesPage,
  SettingsPage,
  SongEditorPage,
  SongsPage,
  TeamsPage,
  TrashPage,
  prefetchQueue,
} from "./routePreloader";
import { OrganizationRedirect } from "../pages/OrganizationRedirect";

function canPrefetch(): boolean {
  if (typeof navigator === "undefined") return false;
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!connection) return true;
  if (connection.saveData) return false;
  return !["slow-2g", "2g"].includes(connection.effectiveType || "");
}

function runWhenIdle(cb: () => void, timeout = 2000) {
  if (typeof window === "undefined") return;
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(cb, { timeout });
  } else {
    setTimeout(cb, 1);
  }
}

function prefetchRemainingRoutes() {
  if (!canPrefetch()) return;

  let i = 0;
  const step = () => {
    if (i >= prefetchQueue.length) return;
    const importFn = prefetchQueue[i++];
    importFn().catch(() => {});
    runWhenIdle(step);
  };

  runWhenIdle(step);
}

const RouteErrorFallback = ({ resetErrorBoundary }: { resetErrorBoundary: () => void }) => {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center flex-1 h-full min-h-75 text-center p-6 bg-m3-bg">
      <h2 className="text-xl font-bold mb-2">{t("routes.errorBoundary.title")}</h2>
      <p className="text-gray-500 mb-4">{t("routes.errorBoundary.desc")}</p>
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 min-h-10 bg-m3-primary text-white rounded-md hover:bg-m3-primary-dark transition-colors cursor-pointer"
      >
        {t("routes.errorBoundary.reloadBtn")}
      </button>
    </div>
  );
};

const ErrorFallback = ({ resetErrorBoundary }: { resetErrorBoundary: () => void }) => {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
      <h2 className="text-xl font-bold mb-2">{t("routes.errorBoundary.title")}</h2>
      <p className="text-gray-500 mb-4">{t("routes.errorBoundary.desc")}</p>
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 min-h-10 bg-m3-primary text-white rounded-md hover:bg-m3-primary-dark transition-colors cursor-pointer"
      >
        {t("routes.errorBoundary.reloadBtn")}
      </button>
    </div>
  );
};

/** Logged-in home: always land on the active org's folders. */
const HomeRedirect = () => {
  const { organization } = useAuth();
  if (!organization?.slug) return <PageLoader />;
  return <Navigate to={`/${organization.slug}/folders`} replace />;
};

const OrganizationGuard = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const { organization, isLoading } = useAuth();

  // Demo mode — session flag + reserved slug `hosanna-demo`; skip org redirect.
  if (isDemoMode()) return <Outlet />;

  if (isLoading) return <PageLoader />;

  if (!organization) {
    // Let ProtectedRoute send unauthenticated / no-org users to the auth app.
    return <Navigate to="/" replace />;
  }

  if (slug && slug !== organization.slug) {
    const correctPathname = location.pathname.replace(
      new RegExp(`^/${slug}`),
      `/${organization.slug}`,
    );

    return <Navigate to={`${correctPathname}${location.search}${location.hash}`} replace />;
  }

  return <Outlet />;
};

export const AppRoutes: React.FC = () => {
  usePreloadPermissions();

  useEffect(() => {
    prefetchRemainingRoutes();
  }, []);

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error) => {
        console.error("[AppRoutes] ErrorBoundary caught:", error);
        posthog?.captureException?.(error);
      }}
    >
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<ExternalAuthRedirect path="/login" />} />
          <Route path="/auth/error" element={<ExternalAuthRedirect path="/auth/error" />} />
          <Route path="/oauth/consent" element={<ExternalAuthRedirect path="/oauth/consent" />} />
          <Route path="/two-factor" element={<ExternalAuthRedirect path="/two-factor" />} />
          <Route path="/register" element={<ExternalAuthRedirect path="/register" />} />
          <Route path="/new" element={<ExternalAuthRedirect path="/new" />} />
          <Route path="/verify-email" element={<ExternalAuthRedirect path="/verify-email" />} />
          <Route
            path="/forgot-password"
            element={<ExternalAuthRedirect path="/forgot-password" />}
          />
          <Route path="/reset-password" element={<ExternalAuthRedirect path="/reset-password" />} />
          <Route
            path="/accept-invitation"
            element={<ExternalAuthRedirect path="/accept-invitation" />}
          />
          <Route path="/captcha" element={<ExternalAuthRedirect path="/captcha" />} />
          <Route path="/onboarding" element={<ExternalAuthRedirect path="/onboarding" />} />

          {/* Demo mode entry point — no auth required */}
          <Route path="/demo" element={<DemoPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/:slug" element={<OrganizationGuard />}>
              <Route element={<MainLayout />}>
                <Route index element={<Navigate to="folders" replace />} />
                <Route
                  path="folders"
                  element={
                    <ErrorBoundary
                      FallbackComponent={RouteErrorFallback}
                      onError={(error) => {
                        posthog?.captureException?.(error);
                      }}
                    >
                      <FoldersPage />
                    </ErrorBoundary>
                  }
                />
                <Route path="songs" element={<SongsPage />} />
                <Route path="songs/:id" element={<SongEditorPage />} />
                <Route path="collections" element={<CollectionsPage />} />
                <Route path="collections/:id" element={<CollectionDetailPage />} />
                <Route path="services" element={<ServicesPage />} />
                <Route path="services/:id" element={<ServiceDetailPage />} />
                <Route path="teams" element={<TeamsPage />} />
                <Route path="agenda" element={<AgendaPage />} />
                <Route path="trash" element={<TrashPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="organization" element={<OrganizationRedirect />} />
                <Route path="analytics" element={<AnalyticsPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};
