import { DASHBOARD_COLUMNS, normalizeLayout } from "./normalization.js";
import { isWidgetEligible, type WidgetRegistry } from "./registry.js";
import type { DashboardContext, DashboardLayout, WidgetInstance } from "./types.js";
export function buildDefaultLayout(
  context: DashboardContext,
  registry: WidgetRegistry,
): DashboardLayout {
  const candidates = registry
    .list()
    .filter((definition) => isWidgetEligible(definition, context))
    .map((definition) => ({
      definition,
      role: definition.defaultFor?.find((entry) => entry.role === context.orgRole),
    }))
    .filter((item) => item.role)
    .sort(
      (a, b) =>
        (b.role?.priority ?? 0) - (a.role?.priority ?? 0) ||
        a.definition.id.localeCompare(b.definition.id),
    );
  const items: WidgetInstance[] = [];
  for (const { definition } of candidates) {
    const size = definition.defaultSize;
    let x = 0;
    let y = 0;
    while (
      items.some(
        (item) =>
          x < item.x + item.w && x + size.w > item.x && y < item.y + item.h && y + size.h > item.y,
      )
    ) {
      x += 1;
      if (x + size.w > DASHBOARD_COLUMNS) {
        x = 0;
        y += 1;
      }
    }
    items.push({
      instanceId: `${definition.id}:default`,
      widget: definition.id,
      x,
      y,
      ...size,
      ...(definition.config?.defaults ? { config: { ...definition.config.defaults } } : {}),
    });
  }
  return normalizeLayout(
    { version: 1, items, hidden: [], seen: candidates.map(({ definition }) => definition.id) },
    registry,
  );
}
export function mergeNewEligibleWidgets(
  layout: DashboardLayout,
  context: DashboardContext,
  registry: WidgetRegistry,
): DashboardLayout {
  const next = { ...layout, items: [...layout.items], seen: [...layout.seen] };
  const existing = new Set(next.items.map((item) => item.widget));
  for (const definition of registry.list()) {
    if (!isWidgetEligible(definition, context) || next.seen.includes(definition.id)) continue;
    next.seen.push(definition.id);
    if (!definition.defaultFor?.some((entry) => entry.role === context.orgRole)) continue;
    if (next.hidden.includes(definition.id)) continue;
    if (definition.singleton && existing.has(definition.id)) continue;
    const base = definition.defaultSize;
    next.items.push({
      instanceId: `${definition.id}:introduced`,
      widget: definition.id,
      x: 0,
      y: next.items.reduce((bottom, item) => Math.max(bottom, item.y + item.h), 0),
      ...base,
      ...(definition.config?.defaults ? { config: { ...definition.config.defaults } } : {}),
    });
    existing.add(definition.id);
  }
  return normalizeLayout(next, registry);
}
