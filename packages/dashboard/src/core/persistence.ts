import type { DashboardLayout, DashboardPersistence } from "./types.js";
import { normalizeLayout } from "./normalization.js";
import type { WidgetRegistry } from "./registry.js";
export function createValidatedPersistence(persistence: DashboardPersistence, registry: WidgetRegistry): DashboardPersistence {
  return {
    async load(organizationId) {
      const value = await persistence.load(organizationId);
      return value === null ? null : normalizeLayout(value, registry);
    },
    async save(organizationId, layout: DashboardLayout) {
      await persistence.save(organizationId, normalizeLayout(layout, registry));
    },
  };
}
