import React, { lazy } from "react";

export type LazyImportFn<T> = () => Promise<{
  default: React.ComponentType<T>;
}>;

export interface LazyPreloadableComponent<T> extends React.LazyExoticComponent<
  React.ComponentType<T>
> {
  preload: () => Promise<{ default: React.ComponentType<T> }>;
}

export const prefetchQueue: Array<() => Promise<unknown>> = [];

export const lazyImport = <T>(componentImport: LazyImportFn<T>): LazyPreloadableComponent<T> => {
  prefetchQueue.push(componentImport);

  let cachedPromise: Promise<{ default: React.ComponentType<T> }> | null = null;

  const load = () => {
    if (!cachedPromise) {
      cachedPromise = (async () => {
        const pageHasAlreadyBeenForceRefreshed = JSON.parse(
          window.localStorage.getItem("page-force-refreshed") || "false",
        );

        try {
          const component = await componentImport();
          if (pageHasAlreadyBeenForceRefreshed) {
            window.localStorage.setItem("page-force-refreshed", "false");
          }
          return component;
        } catch (error) {
          if (!pageHasAlreadyBeenForceRefreshed) {
            window.localStorage.setItem("page-force-refreshed", "true");
            window.location.reload();
            return new Promise<never>(() => {});
          }
          throw error;
        }
      })();
    }
    return cachedPromise;
  };

  const LazyComp = lazy(load) as LazyPreloadableComponent<T>;
  LazyComp.preload = load;

  return LazyComp;
};

export const AgendaPage = lazyImport(() =>
  import("../pages/AgendaPage").then((m) => ({ default: m.AgendaPage })),
);
export const DemoPage = lazyImport(() =>
  import("../pages/DemoPage").then((m) => ({ default: m.DemoPage })),
);
export const FoldersPage = lazyImport(() =>
  import("../pages/FoldersPage").then((m) => ({ default: m.FoldersPage })),
);
export const SongsPage = lazyImport(() =>
  import("../pages/Songs/SongsPage").then((m) => ({ default: m.SongsPage })),
);
export const SongEditorPage = lazyImport(() =>
  import("../pages/Songs/SongEditorPage").then((m) => ({
    default: m.SongEditorPage,
  })),
);
export const ServicesPage = lazyImport(() =>
  import("../pages/Services/ServicesPage").then((m) => ({
    default: m.ServicesPage,
  })),
);
export const ServiceDetailPage = lazyImport(() =>
  import("../pages/Services/ServiceDetailPage").then((m) => ({
    default: m.ServiceDetailPage,
  })),
);
export const SettingsPage = lazyImport(() =>
  import("../pages/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);
export const AnalyticsPage = lazyImport(() =>
  import("../pages/AnalyticsPage").then((m) => ({ default: m.AnalyticsPage })),
);
export const CollectionsPage = lazyImport(() =>
  import("../pages/Collections/CollectionsPage").then((m) => ({
    default: m.CollectionsPage,
  })),
);
export const CollectionDetailPage = lazyImport(() =>
  import("../pages/Collections/CollectionDetailPage").then((m) => ({
    default: m.CollectionDetailPage,
  })),
);
export const TeamsPage = lazyImport(() =>
  import("../pages/TeamsPage").then((m) => ({ default: m.TeamsPage })),
);
export const TrashPage = lazyImport(() =>
  import("../pages/TrashPage").then((m) => ({ default: m.TrashPage })),
);

export const routePreloaders: Array<{
  pattern: RegExp;
  preload: () => Promise<unknown>;
}> = [
  { pattern: /\/songs\/[^/]+/, preload: () => SongEditorPage.preload() },
  { pattern: /\/songs(\/|\?|#|$)/, preload: () => SongsPage.preload() },
  {
    pattern: /\/collections\/[^/]+/,
    preload: () => CollectionDetailPage.preload(),
  },
  {
    pattern: /\/collections(\/|\?|#|$)/,
    preload: () => CollectionsPage.preload(),
  },
  { pattern: /\/services\/[^/]+/, preload: () => ServiceDetailPage.preload() },
  { pattern: /\/services(\/|\?|#|$)/, preload: () => ServicesPage.preload() },
  { pattern: /\/folders(\/|\?|#|$)/, preload: () => FoldersPage.preload() },
  { pattern: /\/teams(\/|\?|#|$)/, preload: () => TeamsPage.preload() },
  { pattern: /\/trash(\/|\?|#|$)/, preload: () => TrashPage.preload() },
  { pattern: /\/settings(\/|\?|#|$)/, preload: () => SettingsPage.preload() },
  {
    pattern: /\/analytics(\/|\?|#|$)/,
    preload: () => AnalyticsPage.preload(),
  },
  { pattern: /\/agenda(\/|\?|#|$)/, preload: () => AgendaPage.preload() },
  { pattern: /\/demo(\/|\?|#|$)/, preload: () => DemoPage.preload() },
];

export function preloadRoute(pathname: string): Promise<unknown> | null {
  for (const route of routePreloaders) {
    if (route.pattern.test(pathname)) {
      return route.preload();
    }
  }
  return null;
}
