/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Typed app-scoped settings registry — apps register a namespace under
 * `personal-settings.apps.<id>` with defaults, optional flat→nested migration,
 * and get/set that rides the shared localStorage + metadata cache.
 */

import type { AppSettingsMap, PersonalSettings } from "./types.js";

export type AppSettingsScopeId = string;

export type AppSettingsScope<T extends Record<string, unknown>> = {
  readonly id: AppSettingsScopeId;
  readonly defaults: T;
  /**
   * Lift legacy flat root keys (and similar) into this scope once.
   * Return only keys that should land under `apps[id]`.
   */
  readonly migrateFromRoot?: (root: Record<string, unknown>) => Partial<T>;
};

type AnyScope = AppSettingsScope<Record<string, unknown>>;

const registry = new Map<AppSettingsScopeId, AnyScope>();

/** Create a typed scope definition (does not register). */
export function defineAppSettingsScope<T extends Record<string, unknown>>(
  def: AppSettingsScope<T>,
): AppSettingsScope<T> {
  return def;
}

export function getRegisteredAppSettingsScopes(): readonly AnyScope[] {
  return [...registry.values()];
}

export function getRegisteredAppSettingsScope(id: AppSettingsScopeId): AnyScope | undefined {
  return registry.get(id);
}

export function isAppSettingsScopeRegistered(id: AppSettingsScopeId): boolean {
  return registry.has(id);
}

/** Resolve a scope object or id to the registered definition (throws if missing). */
export function resolveAppSettingsScope<T extends Record<string, unknown>>(
  scopeOrId: AppSettingsScope<T> | AppSettingsScopeId,
): AppSettingsScope<T> {
  if (typeof scopeOrId === "string") {
    const found = registry.get(scopeOrId);
    if (!found) {
      throw new Error(`[personal-settings] App settings scope "${scopeOrId}" is not registered`);
    }
    return found as AppSettingsScope<T>;
  }
  if (!registry.has(scopeOrId.id)) {
    throw new Error(`[personal-settings] App settings scope "${scopeOrId.id}" is not registered`);
  }
  return scopeOrId;
}

/**
 * Deep-merge two `apps` maps. For each scope id, `prefer` overwrites `base`
 * per key. Scopes present in only one side are kept.
 */
export function mergeAppSettingsMaps(
  base: AppSettingsMap | undefined,
  prefer: AppSettingsMap | undefined,
): AppSettingsMap {
  const ids = new Set([...Object.keys(base ?? {}), ...Object.keys(prefer ?? {})]);
  const out: AppSettingsMap = {};
  for (const id of ids) {
    out[id] = { ...(base?.[id] ?? {}), ...(prefer?.[id] ?? {}) };
  }
  return out;
}

/** Merge a partial root blob into existing settings without dropping unknown apps. */
export function mergePersonalSettingsPreservingApps(
  base: PersonalSettings,
  patch: Partial<PersonalSettings>,
): PersonalSettings {
  const { apps: patchApps, ...rest } = patch;
  return {
    ...base,
    ...rest,
    apps: mergeAppSettingsMaps(base.apps, patchApps),
  };
}

/**
 * Apply registered `migrateFromRoot` helpers: nest flat legacy keys under
 * `apps[id]`, strip those keys from the root, return whether anything changed.
 */
export function applyScopeMigrations(settings: PersonalSettings): {
  settings: PersonalSettings;
  changed: boolean;
} {
  if (registry.size === 0) {
    return { settings, changed: false };
  }

  const root = settings as Record<string, unknown>;
  let apps: AppSettingsMap = { ...(settings.apps ?? {}) };
  const stripKeys = new Set<string>();
  let changed = false;

  for (const scope of registry.values()) {
    const migrated = scope.migrateFromRoot?.(root) ?? {};
    const migratedKeys = Object.keys(migrated);
    if (migratedKeys.length === 0) continue;

    const prev = apps[scope.id] ?? {};
    const next = { ...scope.defaults, ...migrated, ...prev };
    apps = { ...apps, [scope.id]: next as Record<string, unknown> };
    for (const key of migratedKeys) {
      if (key in root && key !== "apps" && key !== "theme" && key !== "language") {
        stripKeys.add(key);
      }
    }
    changed = true;
  }

  if (!changed) {
    return { settings, changed: false };
  }

  const next: PersonalSettings = { ...settings, apps };
  for (const key of stripKeys) {
    delete (next as Record<string, unknown>)[key];
  }
  return { settings: next, changed: true };
}

/** Snapshot helpers used by the store (registered after store module init). */
type StoreBridge = {
  getState: () => PersonalSettings;
  setState: (
    updater: (prev: PersonalSettings) => PersonalSettings,
    opts?: { sync?: boolean },
  ) => void;
  subscribe: (listener: () => void) => () => void;
  parseRemote: (raw: unknown) => Partial<PersonalSettings> | null;
};

let bridge: StoreBridge | null = null;

/** Called once from the store module to wire get/set into the registry API. */
export function bindAppSettingsStore(next: StoreBridge): void {
  bridge = next;
}

function requireBridge(): StoreBridge {
  if (!bridge) {
    throw new Error("[personal-settings] Store not bound; import store before using scope APIs");
  }
  return bridge;
}

/**
 * Register a scope (idempotent for the same id). Re-runs flat→nested migration
 * against the current in-memory blob so boot order is safe.
 */
export function registerAppSettingsScope<T extends Record<string, unknown>>(
  scope: AppSettingsScope<T>,
): AppSettingsScope<T> {
  registry.set(scope.id, scope as AnyScope);

  if (bridge) {
    const { settings, changed } = applyScopeMigrations(bridge.getState());
    if (changed) {
      bridge.setState(() => settings);
    }
  }

  return scope;
}

export function getAppSettings<T extends Record<string, unknown>>(
  scopeOrId: AppSettingsScope<T> | AppSettingsScopeId,
): T {
  const scope = resolveAppSettingsScope(scopeOrId);
  const state = requireBridge().getState();
  const stored = state.apps?.[scope.id] ?? {};
  return { ...scope.defaults, ...stored } as T;
}

export function updateAppSettings<T extends Record<string, unknown>>(
  scopeOrId: AppSettingsScope<T> | AppSettingsScopeId,
  patch: Partial<T>,
  opts?: { sync?: boolean },
): T {
  const scope = resolveAppSettingsScope(scopeOrId);
  requireBridge().setState((prev) => {
    const current = { ...scope.defaults, ...(prev.apps?.[scope.id] ?? {}) };
    const nextScope = { ...current, ...patch } as Record<string, unknown>;
    return {
      ...prev,
      apps: {
        ...(prev.apps ?? {}),
        [scope.id]: nextScope,
      },
    };
  }, opts);
  return getAppSettings(scope);
}

export function updateAppSetting<T extends Record<string, unknown>, K extends keyof T>(
  scopeOrId: AppSettingsScope<T> | AppSettingsScopeId,
  key: K,
  value: T[K],
  opts?: { sync?: boolean },
): T {
  return updateAppSettings(scopeOrId, { [key]: value } as unknown as Partial<T>, opts);
}

export async function updateAppSettingsSafe<T extends Record<string, unknown>>(
  scopeOrId: AppSettingsScope<T> | AppSettingsScopeId,
  patch: Partial<T>,
  opts?: { readRemoteMetadata?: () => Promise<unknown> },
): Promise<T> {
  const scope = resolveAppSettingsScope(scopeOrId);
  const b = requireBridge();

  if (opts?.readRemoteMetadata) {
    try {
      const remote = b.parseRemote(await opts.readRemoteMetadata());
      if (remote) {
        b.setState(
          (prev) => ({
            ...prev,
            apps: mergeAppSettingsMaps(remote.apps, prev.apps),
          }),
          { sync: false },
        );
      }
    } catch {
      /* keep local */
    }
  }

  return updateAppSettings(scope, patch);
}

export function subscribeAppSettings(
  scopeOrId: AppSettingsScopeId | AppSettingsScope<Record<string, unknown>>,
  listener: () => void,
): () => void {
  const id = typeof scopeOrId === "string" ? scopeOrId : scopeOrId.id;
  let prev = JSON.stringify(requireBridge().getState().apps?.[id] ?? null);
  return requireBridge().subscribe(() => {
    const next = JSON.stringify(requireBridge().getState().apps?.[id] ?? null);
    if (next !== prev) {
      prev = next;
      listener();
    }
  });
}

export type AppSettingsAccessor<T extends Record<string, unknown>> = {
  scope: AppSettingsScope<T>;
  get: () => T;
  set: (patch: Partial<T>) => T;
  setKey: <K extends keyof T>(key: K, value: T[K]) => T;
  subscribe: (listener: () => void) => () => void;
};

/** Stable accessor for React `useSyncExternalStore` (and non-React callers). */
export function createAppSettingsAccessor<T extends Record<string, unknown>>(
  scope: AppSettingsScope<T>,
): AppSettingsAccessor<T> {
  return {
    scope,
    get: () => getAppSettings(scope),
    set: (patch) => updateAppSettings(scope, patch),
    setKey: (key, value) => updateAppSetting(scope, key, value),
    subscribe: (listener) => subscribeAppSettings(scope, listener),
  };
}
