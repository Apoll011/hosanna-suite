# Creating dashboard widgets

The dashboard engine lives in the workspace package @hosanna/dashboard. Its core package is framework-independent. A consuming app owns widget data, React components, translations, and persistence configuration.

Auth currently composes the dashboard in apps/auth. Another app can use the same engine without adding app-specific code to the package.

## 1. Define the widget

Add a serializable definition in the consumer's widget registry. Keep the ID stable after release because saved layouts refer to it.

    {
      id: "music.recent-songs",
      app: "music",
      title: "dashboard.widgets.recentSongs.title",
      description: "dashboard.widgets.recentSongs.description",
      icon: "music",
      minSize: { w: 3, h: 2 },
      defaultSize: { w: 4, h: 3 },
      maxSize: { w: 8, h: 6 },
      singleton: true,
      requires: ["song.access"],
      defaultFor: [
        { role: "owner", priority: 50 },
        { role: "editor", priority: 80 },
      ],
    }

The app field is the owner in SUITE_APP_REGISTRY, not the app that hosts the dashboard. Auth currently uses the music catalog ID for Studio's song and service domain. The owner must be live and accessible before the widget is offered in the gallery.

Use the existing PermissionString values in requires. This controls widget availability in the UI. The widget's API must still enforce the same authorization itself.

defaultFor controls initial placement for an organization role. Keep the priority deterministic. A user's role can differ between organizations, so the consumer must load layouts using the organization ID.

## 2. Register the renderer

Implement a React component separately from the definition. The component receives a persisted widget instance, including its configuration.

    import type { WidgetRendererProps } from "@hosanna/dashboard/react";

    export function RecentSongsWidget({ instance }: WidgetRendererProps) {
      const limit = typeof instance.config?.limit === "number"
        ? instance.config.limit
        : 5;

      return <RecentSongs limit={limit} />;
    }

Add the component to the consumer's renderer map using the same widget ID. Keep data fetching here or in a domain-owned hook, never in the dashboard core. Fetch only when the widget is mounted. Include the organization ID in every data cache key and clear or invalidate those caches when the active organization changes.

Use existing domain endpoints first. Each endpoint must check authorization and tenant scope on the server. The dashboard's visibility rules are not a security boundary.

The gallery should include only definitions with registered renderers. listRenderableWidgets supports this check. Definitions for future apps can be composed in the registry, but an unavailable owner or missing renderer must not be offered as an addable widget.

## 3. Add configuration when needed

Configuration belongs in the definition and is stored separately from layout coordinates.

    config: {
      version: 1,
      defaults: { limit: 5 },
      schema: {
        fields: {
          limit: { type: "number", label: "dashboard.widgets.recentSongs.limit", min: 1, max: 20 },
        },
      },
      migrations: [
        { from: 0, to: 1, renameFields: { count: "limit" } },
      ],
    }

The schema is serializable. Normalization applies defaults, runs declared field renames, and falls back for invalid known values while retaining unknown configuration fields. WidgetConfiguration renders the supported string, number, boolean, and enum fields. A consumer can supply its translation resolver and can provide a specialized configuration UI when the widget needs controls beyond those fields.

## 4. Compose the consumer registry

Create the engine registry from definitions owned by any suite apps the dashboard can show. Then create a renderer map keyed by those IDs.

    const registry = createWidgetRegistry(authWidgets, musicWidgets);

    const renderers = {
      "auth.app-launcher": AppLauncherWidget,
      "music.recent-songs": RecentSongsWidget,
    };

The owner app does not need to host the dashboard. Do not special-case Auth-owned widgets in the engine.

## 5. Use the layout and editor

Use Dashboard for CSS Grid view mode. It renders known widgets from their stored 12-column coordinates. Mobile uses one column ordered by y, then x, then instance ID.

Use @hosanna/dashboard/gridstack only when entering desktop customization. Keep the saved layout as the source of truth. Hold edits in a draft, call the persistence adapter once on Done, and discard the draft on Cancel. Mobile customization should use keyboard-accessible controls rather than drag positioning.

The core persistence helpers accept an organization ID and a generic persistence adapter. A consumer can adapt those calls to personal settings, IndexedDB, local storage, or a remote API.

## 6. Validate the widget

Add core tests for registry membership, role defaults, permission filtering, configuration, and layout normalization. Test that an unavailable owner or missing renderer does not make a widget addable, and that unknown widget IDs and fields survive a load and save cycle.

For Auth widgets, add translations to each Auth UI locale and reuse Auth's organization-aware API helper. Do not add an aggregate dashboard endpoint when existing domain routes provide the data.
