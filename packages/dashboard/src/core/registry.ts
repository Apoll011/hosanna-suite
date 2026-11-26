import type { WidgetDefinition } from "./types.js";
export type WidgetRegistry = {
  definitions: readonly WidgetDefinition[];
  get: (id: string) => WidgetDefinition | undefined;
  list: () => readonly WidgetDefinition[];
};
export function createWidgetRegistry(...groups: readonly WidgetDefinition[][]): WidgetRegistry {
  const definitions = groups.flat();
  const byId = new Map<string, WidgetDefinition>();
  for (const definition of definitions) {
    if (!definition.id.trim() || !definition.app.trim())
      throw new Error("Widget id and app must be non-empty");
    const sizes = [definition.minSize, definition.defaultSize, definition.maxSize].filter(
      (size): size is NonNullable<WidgetDefinition["maxSize"]> => size !== undefined,
    );
    if (
      sizes.some(
        (size) =>
          !Number.isInteger(size.w) || !Number.isInteger(size.h) || size.w < 1 || size.h < 1,
      )
    ) {
      throw new Error("Widget sizes must use positive integer grid units");
    }
    if (
      definition.minSize.w > 12 ||
      definition.defaultSize.w > 12 ||
      definition.defaultSize.w < definition.minSize.w ||
      definition.defaultSize.h < definition.minSize.h ||
      (definition.maxSize &&
        (definition.defaultSize.w > definition.maxSize.w ||
          definition.defaultSize.h > definition.maxSize.h))
    ) {
      throw new Error("Widget size constraints are inconsistent with the 12-column grid");
    }
    if (byId.has(definition.id)) throw new Error("Duplicate widget id: " + definition.id);
    byId.set(definition.id, definition);
  }
  return { definitions, get: (id) => byId.get(id), list: () => definitions };
}
export function isWidgetEligible(
  definition: WidgetDefinition,
  context: {
    permissions: readonly string[];
    apps: readonly { id: string; status?: string; accessible?: boolean }[];
  },
): boolean {
  if (definition.enabled === false) return false;
  const owner = context.apps.find((app) => app.id === definition.app);
  if (!owner || owner.status === "coming_soon" || owner.accessible === false) return false;
  const granted = new Set(context.permissions);
  return (definition.requires ?? []).every((permission) => granted.has(permission));
}
