import type { ConfigField, DashboardLayout, WidgetDefinition, WidgetInstance } from "./types.js";
import type { WidgetRegistry } from "./registry.js";
export const DASHBOARD_LAYOUT_VERSION = 1;
export const DASHBOARD_COLUMNS = 12;
export const EMPTY_LAYOUT: DashboardLayout = {
  version: DASHBOARD_LAYOUT_VERSION,
  items: [],
  hidden: [],
  seen: [],
};
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function integer(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.floor(value) : fallback;
}
function constrainedSize(value: unknown, definition?: WidgetDefinition): { w: number; h: number } {
  const record = isRecord(value) ? value : {};
  const min = definition?.minSize ?? { w: 1, h: 1 };
  const max = definition?.maxSize ?? { w: DASHBOARD_COLUMNS, h: 100 };
  return {
    w: Math.max(
      min.w,
      Math.min(max.w, DASHBOARD_COLUMNS, integer(record.w, definition?.defaultSize.w ?? 1)),
    ),
    h: Math.max(min.h, Math.min(max.h, 100, integer(record.h, definition?.defaultSize.h ?? 1))),
  };
}
function overlaps(a: WidgetInstance, b: WidgetInstance): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function place(item: WidgetInstance, placed: WidgetInstance[]): WidgetInstance {
  let candidate = {
    ...item,
    x: Math.max(0, Math.min(DASHBOARD_COLUMNS - item.w, item.x)),
    y: Math.max(0, item.y),
  };
  while (placed.some((other) => overlaps(candidate, other)))
    candidate = { ...candidate, y: candidate.y + 1 };
  return candidate;
}
function validConfigField(value: unknown, field: ConfigField): boolean {
  if (field.type === "string" && typeof value !== "string") return false;
  if (field.type === "number" && (typeof value !== "number" || !Number.isFinite(value)))
    return false;
  if (field.type === "boolean" && typeof value !== "boolean") return false;
  if (field.enum && !field.enum.includes(value as string | number | boolean)) return false;
  if (
    typeof value === "number" &&
    ((field.min !== undefined && value < field.min) ||
      (field.max !== undefined && value > field.max))
  )
    return false;
  return true;
}

function normalizeConfig(
  raw: unknown,
  rawVersion: unknown,
  definition: WidgetDefinition,
): { config: Record<string, unknown>; version: number } {
  const configDefinition = definition.config;
  const original = isRecord(raw) ? { ...raw } : {};
  let version = integer(rawVersion, 0);
  const migrations = [...(configDefinition?.migrations ?? [])].sort((a, b) => a.from - b.from);
  for (const migration of migrations) {
    if (migration.from !== version) continue;
    for (const [from, to] of Object.entries(migration.renameFields ?? {})) {
      if (from in original && !(to in original)) original[to] = original[from];
      delete original[from];
    }
    Object.assign(original, migration.defaults ?? {}, original);
    version = migration.to;
  }
  const currentVersion = Math.max(configDefinition?.version ?? version, version);
  if (version > (configDefinition?.version ?? version)) {
    return { config: original, version };
  }
  const merged = { ...(configDefinition?.defaults ?? {}), ...original };
  for (const [key, field] of Object.entries(configDefinition?.schema?.fields ?? {})) {
    if (key in merged && !validConfigField(merged[key], field)) {
      if (key in (configDefinition?.defaults ?? {}))
        merged[key] = configDefinition?.defaults?.[key];
      else delete merged[key];
    }
  }
  return { config: merged, version: currentVersion };
}
export function normalizeLayout(value: unknown, registry: WidgetRegistry): DashboardLayout {
  if (!isRecord(value)) return { ...EMPTY_LAYOUT, items: [], hidden: [], seen: [] };
  const originalItems = Array.isArray(value.items) ? value.items : [];
  const ids = new Set<string>();
  const singletonWidgets = new Set<string>();
  const valid: WidgetInstance[] = [];
  for (const raw of originalItems) {
    if (
      !isRecord(raw) ||
      typeof raw.instanceId !== "string" ||
      !raw.instanceId ||
      typeof raw.widget !== "string"
    )
      continue;
    if (ids.has(raw.instanceId)) continue;
    const definition = registry.get(raw.widget);
    if (definition?.singleton && singletonWidgets.has(definition.id)) continue;
    ids.add(raw.instanceId);
    if (definition?.singleton) singletonWidgets.add(definition.id);
    const size = constrainedSize(raw, definition);
    const instance: WidgetInstance = {
      ...raw,
      instanceId: raw.instanceId,
      widget: raw.widget,
      x: integer(raw.x, 0),
      y: Math.max(0, integer(raw.y, 0)),
      ...size,
    };
    if (definition?.config) {
      const normalizedConfig = normalizeConfig(raw.config, raw.configVersion, definition);
      instance.config = normalizedConfig.config;
      instance.configVersion = normalizedConfig.version;
    } else if (isRecord(raw.config)) instance.config = { ...raw.config };
    valid.push(instance);
  }
  const sorted = [...valid].sort(
    (a, b) => a.y - b.y || a.x - b.x || a.instanceId.localeCompare(b.instanceId),
  );
  const placed: WidgetInstance[] = [];
  for (const item of sorted) placed.push(place(item, placed));
  const stringList = (x: unknown) =>
    Array.isArray(x) ? x.filter((v): v is string => typeof v === "string") : [];
  return {
    ...value,
    version:
      integer(value.version, DASHBOARD_LAYOUT_VERSION) > DASHBOARD_LAYOUT_VERSION
        ? integer(value.version, DASHBOARD_LAYOUT_VERSION)
        : DASHBOARD_LAYOUT_VERSION,
    items: placed,
    hidden: [...new Set(stringList(value.hidden))],
    seen: [...new Set(stringList(value.seen))],
  } as DashboardLayout;
}
export function serializeLayout(layout: DashboardLayout): string {
  return JSON.stringify(layout);
}
export function deserializeLayout(raw: string, registry: WidgetRegistry): DashboardLayout {
  try {
    return normalizeLayout(JSON.parse(raw) as unknown, registry);
  } catch {
    return normalizeLayout(null, registry);
  }
}
export function mobileOrder(layout: DashboardLayout): WidgetInstance[] {
  return [...layout.items].sort(
    (a, b) => a.y - b.y || a.x - b.x || a.instanceId.localeCompare(b.instanceId),
  );
}
