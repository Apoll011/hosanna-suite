import { normalizeLayout } from "./normalization.js";
import type { WidgetRegistry } from "./registry.js";
import type { DashboardLayout, WidgetInstance } from "./types.js";
export function addWidget(
  layout: DashboardLayout,
  widget: string,
  registry: WidgetRegistry,
  instanceId: string,
): DashboardLayout {
  const definition = registry.get(widget);
  if (!definition || (definition.singleton && layout.items.some((item) => item.widget === widget)))
    return layout;
  return normalizeLayout(
    {
      ...layout,
      items: [
        ...layout.items,
        {
          instanceId,
          widget,
          x: 0,
          y: 0,
          ...definition.defaultSize,
          ...(definition.config?.defaults ? { config: { ...definition.config.defaults } } : {}),
        },
      ],
    },
    registry,
  );
}
export function removeWidget(layout: DashboardLayout, instanceId: string): DashboardLayout {
  return { ...layout, items: layout.items.filter((item) => item.instanceId !== instanceId) };
}
export function updateWidget(
  layout: DashboardLayout,
  instanceId: string,
  patch: Partial<WidgetInstance>,
  registry: WidgetRegistry,
): DashboardLayout {
  return normalizeLayout(
    {
      ...layout,
      items: layout.items.map((item) =>
        item.instanceId === instanceId
          ? { ...item, ...patch, instanceId: item.instanceId, widget: item.widget }
          : item,
      ),
    },
    registry,
  );
}
