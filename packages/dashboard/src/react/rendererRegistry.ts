import type { WidgetRegistry } from "../core/registry.js";
import type { WidgetDefinition } from "../core/types.js";
import type { WidgetRenderers } from "./Dashboard.js";

export function listRenderableWidgets(
  registry: WidgetRegistry,
  renderers: WidgetRenderers,
): WidgetDefinition[] {
  return registry.list().filter((definition) => Boolean(renderers[definition.id]));
}

export function listMissingWidgetRenderers(
  registry: WidgetRegistry,
  renderers: WidgetRenderers,
): string[] {
  return registry
    .list()
    .filter((definition) => !renderers[definition.id])
    .map((definition) => definition.id);
}
