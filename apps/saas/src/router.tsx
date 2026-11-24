// SPDX-License-Identifier: AGPL-3.0-only
import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
} from "@tanstack/react-router";

import { ErrorComponent, NotFoundComponent, RootComponent } from "./routes/__root";

// Manual route tree with route-level code splitting. Every page is a
// `lazyRouteComponent` so its JS is a separate chunk that is downloaded only
// when needed. `defaultPreload: "intent"` makes hovering an internal link
// preload the target chunk, so navigation feels instant.
const rootRoute = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: lazyRouteComponent(() => import("./routes/index"), "Component"),
});

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/about",
  component: lazyRouteComponent(() => import("./routes/about"), "Component"),
});

const chordproRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/chordpro",
  component: lazyRouteComponent(() => import("./routes/chordpro"), "Component"),
});

const contactRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/contact",
  component: lazyRouteComponent(() => import("./routes/contact"), "Component"),
});

const privacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/privacy",
  component: lazyRouteComponent(() => import("./routes/privacy"), "Component"),
});

const termsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/terms",
  component: lazyRouteComponent(() => import("./routes/terms"), "Component"),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  aboutRoute,
  chordproRoute,
  contactRoute,
  privacyRoute,
  termsRoute,
]);

export const router = createRouter({
  routeTree,
  scrollRestoration: true,
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  defaultViewTransition: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
