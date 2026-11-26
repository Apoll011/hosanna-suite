import type { DashboardLayout, DashboardPersistence } from "./types.js";
import { normalizeLayout } from "./normalization.js";
import type { WidgetRegistry } from "./registry.js";
import { buildDefaultLayout, mergeNewEligibleWidgets } from "./defaults.js";
import type { DashboardContext } from "./types.js";
export type ValidatedDashboardPersistence = {
  load: (organizationId: string) => Promise<DashboardLayout | null>;
  save: (organizationId: string, layout: DashboardLayout) => Promise<void>;
};
export function createValidatedPersistence(
  persistence: DashboardPersistence,
  registry: WidgetRegistry,
): ValidatedDashboardPersistence {
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

export async function loadOrCreateDashboard({
  organizationId,
  context,
  persistence,
  registry,
}: {
  organizationId: string;
  context: DashboardContext;
  persistence: DashboardPersistence;
  registry: WidgetRegistry;
}): Promise<DashboardLayout> {
  const saved = await persistence.load(organizationId);
  const layout =
    saved === null
      ? buildDefaultLayout(context, registry)
      : mergeNewEligibleWidgets(normalizeLayout(saved, registry), context, registry);
  if (saved === null || JSON.stringify(saved) !== JSON.stringify(layout)) {
    await persistence.save(organizationId, layout);
  }
  return layout;
}

export function beginDashboardDraft(layout: DashboardLayout): {
  saved: DashboardLayout;
  draft: DashboardLayout;
} {
  return { saved: structuredClone(layout), draft: structuredClone(layout) };
}

export function cancelDashboardDraft(draft: { saved: DashboardLayout }): DashboardLayout {
  return structuredClone(draft.saved);
}

export async function commitDashboardDraft({
  organizationId,
  draft,
  persistence,
  registry,
}: {
  organizationId: string;
  draft: DashboardLayout;
  persistence: DashboardPersistence;
  registry: WidgetRegistry;
}): Promise<DashboardLayout> {
  const layout = normalizeLayout(draft, registry);
  await persistence.save(organizationId, layout);
  return layout;
}
