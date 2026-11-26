import { createWidgetRegistry } from "@hosanna/dashboard/core";
import type { WidgetRenderers } from "@hosanna/dashboard/react";
import { AppLauncherWidget, FavoritesWidget, LibrarySummaryWidget, NextServiceWidget, SubscriptionWidget } from "./widgets";

export const authDashboardWidgets = [
  {
    id: "auth.app-launcher",
    app: "auth",
    title: "home.widgets.launcher.title",
    description: "home.widgets.launcher.description",
    icon: "grid",
    minSize: { w: 4, h: 2 },
    defaultSize: { w: 8, h: 2 },
    maxSize: { w: 12, h: 4 },
    defaultFor: [{ role: "owner", priority: 100 }, { role: "admin", priority: 100 }, { role: "teamLeader", priority: 100 }, { role: "editor", priority: 100 }, { role: "musician", priority: 100 }, { role: "guest", priority: 100 }, { role: "member", priority: 100 }],
    singleton: true,
  },
  {
    id: "auth.favorites",
    app: "auth",
    title: "home.widgets.favorites.title",
    description: "home.widgets.favorites.description",
    icon: "star",
    minSize: { w: 3, h: 2 },
    defaultSize: { w: 4, h: 2 },
    maxSize: { w: 8, h: 4 },
    defaultFor: [{ role: "owner", priority: 90 }, { role: "admin", priority: 90 }, { role: "teamLeader", priority: 90 }, { role: "editor", priority: 90 }, { role: "musician", priority: 90 }, { role: "guest", priority: 90 }, { role: "member", priority: 90 }],
    singleton: true,
  },
  {
    id: "auth.next-service",
    app: "music",
    title: "home.widgets.nextService.title",
    description: "home.widgets.nextService.description",
    icon: "calendar",
    minSize: { w: 3, h: 2 },
    defaultSize: { w: 4, h: 2 },
    maxSize: { w: 6, h: 4 },
    requires: ["service.access"],
    defaultFor: [{ role: "owner", priority: 60 }, { role: "admin", priority: 60 }, { role: "editor", priority: 60 }, { role: "musician", priority: 90 }, { role: "guest", priority: 30 }, { role: "member", priority: 90 }],
    singleton: true,
  },
  {
    id: "auth.library-summary",
    app: "music",
    title: "home.widgets.library.title",
    description: "home.widgets.library.description",
    icon: "music",
    minSize: { w: 3, h: 2 },
    defaultSize: { w: 4, h: 2 },
    maxSize: { w: 6, h: 4 },
    requires: ["song.access"],
    defaultFor: [{ role: "owner", priority: 80 }, { role: "admin", priority: 80 }, { role: "editor", priority: 90 }, { role: "musician", priority: 60 }, { role: "guest", priority: 30 }, { role: "member", priority: 60 }],
    singleton: true,
  },
  {
    id: "auth.subscription",
    app: "auth",
    title: "home.widgets.subscription.title",
    description: "home.widgets.subscription.description",
    icon: "credit-card",
    minSize: { w: 3, h: 2 },
    defaultSize: { w: 4, h: 2 },
    maxSize: { w: 6, h: 4 },
    requires: ["billing.access"],
    defaultFor: [{ role: "owner", priority: 40 }, { role: "admin", priority: 30 }],
    singleton: true,
  },
] as const;

export const authDashboardRegistry = createWidgetRegistry([...authDashboardWidgets]);
export const authDashboardRenderers: WidgetRenderers = {
  "auth.app-launcher": AppLauncherWidget,
  "auth.favorites": FavoritesWidget,
  "auth.next-service": NextServiceWidget,
  "auth.library-summary": LibrarySummaryWidget,
  "auth.subscription": SubscriptionWidget,
};
