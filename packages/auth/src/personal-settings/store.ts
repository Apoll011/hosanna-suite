/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Cached personal settings store — localStorage + Better Auth user.metadata.
 * App-specific prefs live under `apps.<scopeId>` (see scopes.ts).
 */

import {
  applyScopeMigrations,
  bindAppSettingsStore,
  mergeAppSettingsMaps,
  mergePersonalSettingsPreservingApps,
} from "./scopes.js";
import {
  CROSS_APP_KEYS,
  DEFAULT_PERSONAL_SETTINGS,
  PERSONAL_SETTINGS_KEY,
  type CrossAppKey,
  type PersonalLanguage,
  type PersonalSettings,
  type PersonalTheme,
} from "./types.js";
import { readThemeCookie, writeThemeCookie } from "./theme.js";

export type PersonalSettingsHost = {
  /** Persist the full JSON blob to Better Auth `user.metadata`. */
  updateUserMetadata: (metadataJson: string) => Promise<void>;
  /**
   * Optional localStorage key for a cached session user object that also
   * carries `metadata` (kept in sync so cold starts see the latest prefs).
   */
  cachedUserKey?: string;
};

let host: PersonalSettingsHost | null = null;

/** Core-only legacy keys (theme/language). App keys migrate via scope.migrateFromRoot. */
const LEGACY_KEYS = {
  theme: "chordpro_theme",
  authTheme: "hosanna_auth_theme",
  authLanguage: "hosanna_auth_language",
} as const;

type Listener = () => void;
const listeners = new Set<Listener>();

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let state: PersonalSettings = loadSettings();

bindAppSettingsStore({
  getState: () => state,
  setState,
  subscribe: subscribePersonalSettings,
  parseRemote: parseSettingsJson,
});

export function configurePersonalSettings(next: PersonalSettingsHost): void {
  host = next;
}

export function getPersonalSettings(): PersonalSettings {
  return state;
}

export function getPersistedSettingsJson(): string | null {
  try {
    return localStorage.getItem(PERSONAL_SETTINGS_KEY);
  } catch {
    return null;
  }
}

export function subscribePersonalSettings(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit() {
  listeners.forEach((l) => l());
}

export function parseSettingsJson(raw: unknown): Partial<PersonalSettings> | null {
  if (!raw) return null;
  let parsed: unknown = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (typeof parsed === "object" && parsed !== null) {
    return parsed as Partial<PersonalSettings>;
  }
  return null;
}

function normalizeTheme(value: unknown): PersonalTheme | undefined {
  if (value === "light" || value === "dark" || value === "system") return value;
  return undefined;
}

function normalizeLanguage(value: unknown): PersonalLanguage | undefined {
  if (value === "pt" || value === "en" || value === "es" || value === "auto") return value;
  return undefined;
}

function normalizeCore(settings: PersonalSettings): PersonalSettings {
  const theme = normalizeTheme(settings.theme);
  const language = normalizeLanguage(settings.language);
  if (theme) settings.theme = theme;
  if (language) settings.language = language;
  if (!settings.apps || typeof settings.apps !== "object") {
    settings.apps = {};
  }
  return settings;
}

/**
 * Build a settings object from a partial blob, always preserving `apps`
 * namespaces from both base and patch.
 */
function hydrateFromPartial(
  partial: Partial<PersonalSettings> | null | undefined,
): PersonalSettings {
  const merged = mergePersonalSettingsPreservingApps(
    { ...DEFAULT_PERSONAL_SETTINGS, apps: {} },
    partial ?? {},
  );
  return normalizeCore(merged);
}

function loadSettings(): PersonalSettings {
  if (typeof window === "undefined") {
    return { ...DEFAULT_PERSONAL_SETTINGS, apps: {} };
  }

  try {
    const stored = localStorage.getItem(PERSONAL_SETTINGS_KEY);
    const parsedStored = parseSettingsJson(stored);
    let settings = hydrateFromPartial(parsedStored);

    const hasLocalSettings = Boolean(parsedStored);
    if (!hasLocalSettings && host?.cachedUserKey) {
      try {
        const cachedUserStr = localStorage.getItem(host.cachedUserKey);
        if (cachedUserStr) {
          const cachedUser = JSON.parse(cachedUserStr) as { metadata?: unknown };
          const parsedMetadata = parseSettingsJson(cachedUser?.metadata);
          if (parsedMetadata) {
            settings = mergePersonalSettingsPreservingApps(settings, parsedMetadata);
            settings = normalizeCore(settings);
          }
        }
      } catch {
        /* ignore */
      }
    }

    let migrated = false;
    const legacyTheme =
      localStorage.getItem(LEGACY_KEYS.theme) || localStorage.getItem(LEGACY_KEYS.authTheme);
    if (legacyTheme === "light" || legacyTheme === "dark" || legacyTheme === "system") {
      settings.theme = legacyTheme;
      migrated = true;
    }
    const legacyLang = localStorage.getItem(LEGACY_KEYS.authLanguage);
    if (
      legacyLang === "pt" ||
      legacyLang === "en" ||
      legacyLang === "es" ||
      legacyLang === "auto"
    ) {
      settings.language = legacyLang;
      migrated = true;
    }

    const scoped = applyScopeMigrations(settings);
    settings = scoped.settings;
    if (scoped.changed) migrated = true;

    if (migrated) {
      localStorage.setItem(PERSONAL_SETTINGS_KEY, JSON.stringify(settings));
      Object.values(LEGACY_KEYS).forEach((key) => localStorage.removeItem(key));
    }

    const cookieTheme = readThemeCookie();
    if (cookieTheme && cookieTheme !== settings.theme) {
      settings = { ...settings, theme: cookieTheme, revisedAt: Date.now() };
      try {
        localStorage.setItem(PERSONAL_SETTINGS_KEY, JSON.stringify(settings));
      } catch {
        /* ignore */
      }
    } else if (!cookieTheme) {
      writeThemeCookie(settings.theme);
    }

    return settings;
  } catch {
    return { ...DEFAULT_PERSONAL_SETTINGS, apps: {} };
  }
}

async function syncMetadataToServer(settingsToSave: PersonalSettings) {
  const serialized = JSON.stringify(settingsToSave);

  if (host?.cachedUserKey) {
    try {
      const cachedUserStr = localStorage.getItem(host.cachedUserKey);
      if (cachedUserStr) {
        const cachedUser = JSON.parse(cachedUserStr) as Record<string, unknown>;
        cachedUser.metadata = serialized;
        localStorage.setItem(host.cachedUserKey, JSON.stringify(cachedUser));
      }
    } catch {
      /* ignore */
    }
  }

  if (!host?.updateUserMetadata) {
    console.warn(
      "[personal-settings] configurePersonalSettings() was not called; skip metadata sync",
    );
    return;
  }

  try {
    await host.updateUserMetadata(serialized);
  } catch (err) {
    console.warn("[personal-settings] Failed to persist to user metadata:", err);
  }
}

function writeLocal(next: PersonalSettings) {
  try {
    localStorage.setItem(PERSONAL_SETTINGS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

function bumpRevisedAt(settings: PersonalSettings): PersonalSettings {
  return { ...settings, revisedAt: Date.now() };
}

function coreEquals(a: PersonalSettings, b: PersonalSettings): boolean {
  return (
    a.theme === b.theme &&
    a.language === b.language &&
    (a.revisedAt ?? 0) === (b.revisedAt ?? 0) &&
    JSON.stringify(a.apps ?? {}) === JSON.stringify(b.apps ?? {})
  );
}

function persistSettings(newSettings: PersonalSettings, opts?: { sync?: boolean }) {
  if (coreEquals(state, newSettings)) {
    state = newSettings;
    return;
  }
  state = newSettings;
  writeLocal(newSettings);
  writeThemeCookie(newSettings.theme);
  emit();

  if (opts?.sync === false) return;

  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    void syncMetadataToServer(newSettings);
  }, 300);
}

function setState(
  updater: (prev: PersonalSettings) => PersonalSettings,
  opts?: { sync?: boolean; bumpRevision?: boolean },
) {
  const next = updater(state);
  persistSettings(opts?.bumpRevision === false ? next : bumpRevisedAt(next), opts);
}

/**
 * Hydrate / reconcile from Better Auth `user.metadata`.
 *
 * - If there is no local cache yet → full hydrate (login / new origin).
 * - If local exists → apply **cross-app** keys (`theme`, `language`) and merge
 *   `apps.*` so Auth warm-cache picks up Studio scopes without wiping them.
 */
export function syncSettingsFromMetadata(metadata: unknown): {
  themeChanged: boolean;
  languageChanged: boolean;
} {
  const parsed = parseSettingsJson(metadata);
  if (!parsed) {
    return { themeChanged: false, languageChanged: false };
  }

  let hasLocal = false;
  try {
    hasLocal = Boolean(localStorage.getItem(PERSONAL_SETTINGS_KEY));
  } catch {
    hasLocal = false;
  }

  const prevTheme = state.theme;
  const prevLanguage = state.language;

  if (!hasLocal) {
    let merged = hydrateFromPartial(parsed);
    const scoped = applyScopeMigrations(merged);
    merged = scoped.settings;
    persistSettings(merged, { sync: false });
    return {
      themeChanged: merged.theme !== prevTheme,
      languageChanged: merged.language !== prevLanguage,
    };
  }

  const remoteRevised =
    typeof parsed.revisedAt === "number" && Number.isFinite(parsed.revisedAt)
      ? parsed.revisedAt
      : 0;
  const localRevised =
    typeof state.revisedAt === "number" && Number.isFinite(state.revisedAt) ? state.revisedAt : 0;
  const remoteCoreWins = remoteRevised >= localRevised;

  const patch: Partial<PersonalSettings> = {
    apps: mergeAppSettingsMaps(parsed.apps, state.apps),
  };
  if (remoteCoreWins) {
    for (const key of CROSS_APP_KEYS) {
      if (key === "theme") {
        const theme = normalizeTheme(parsed.theme);
        if (theme) patch.theme = theme;
      } else if (key === "language") {
        const language = normalizeLanguage(parsed.language);
        if (language) patch.language = language;
      }
    }
    if (remoteRevised > 0) patch.revisedAt = remoteRevised;
  }

  let merged = mergePersonalSettingsPreservingApps(state, patch);
  const scoped = applyScopeMigrations(merged);
  merged = scoped.settings;

  const themeChanged = merged.theme !== prevTheme;
  const languageChanged = merged.language !== prevLanguage;
  const appsChanged = JSON.stringify(merged.apps ?? {}) !== JSON.stringify(state.apps ?? {});
  if (!themeChanged && !languageChanged && !appsChanged && !scoped.changed) {
    return { themeChanged: false, languageChanged: false };
  }

  persistSettings(merged, { sync: false });
  return { themeChanged, languageChanged };
}

export function updatePersonalSetting<K extends keyof PersonalSettings>(
  key: K,
  value: PersonalSettings[K],
): void {
  if (key === "apps") {
    setState(
      (prev) => ({
        ...prev,
        apps: mergeAppSettingsMaps(prev.apps, value as PersonalSettings["apps"]),
      }),
      { bumpRevision: false },
    );
    return;
  }
  setState((prev) => ({ ...prev, [key]: value }));
}

export function updatePersonalSettings(patch: Partial<PersonalSettings>): PersonalSettings {
  const touchesCore = CROSS_APP_KEYS.some((key) => key in patch);
  setState((prev) => mergePersonalSettingsPreservingApps(prev, patch), {
    bumpRevision: touchesCore,
  });
  return state;
}

/**
 * Merge with latest server metadata before patching so Auth cannot wipe
 * other apps' `apps.*` scopes (and the reverse).
 */
export async function updatePersonalSettingsSafe(
  patch: Partial<PersonalSettings>,
  opts?: { readRemoteMetadata?: () => Promise<unknown> },
): Promise<PersonalSettings> {
  if (opts?.readRemoteMetadata) {
    try {
      const remote = parseSettingsJson(await opts.readRemoteMetadata());
      if (remote) {
        // Remote fills gaps; local core + apps win on conflict.
        state = {
          ...hydrateFromPartial(remote),
          theme: state.theme,
          language: state.language,
          apps: mergeAppSettingsMaps(remote.apps, state.apps),
        };
      }
    } catch {
      /* keep local */
    }
  }
  return updatePersonalSettings(patch);
}

export function resetPersonalSettings(): void {
  setState(() => ({ ...DEFAULT_PERSONAL_SETTINGS, apps: {} }));
}

/** Drop the device cache (call on logout). Next login hydrates from metadata. */
export function clearPersonalSettingsCache(): void {
  try {
    localStorage.removeItem(PERSONAL_SETTINGS_KEY);
  } catch {
    /* ignore */
  }
  state = { ...DEFAULT_PERSONAL_SETTINGS, apps: {} };
  emit();
}

export function isCrossAppKey(key: string): key is CrossAppKey {
  return (CROSS_APP_KEYS as readonly string[]).includes(key);
}

/**
 * Re-read device cache (localStorage + optional cached user.metadata).
 * Used after bfcache restore / tab focus so in-memory state matches disk.
 */
export function reloadPersonalSettingsFromCache(): PersonalSettings {
  const next = loadSettings();
  if (coreEquals(state, next)) return state;
  state = next;
  writeThemeCookie(state.theme);
  emit();
  return state;
}

export function syncThemeFromSharedCookie(): boolean {
  const cookieTheme = readThemeCookie();
  if (!cookieTheme || cookieTheme === state.theme) return false;
  persistSettings(bumpRevisedAt({ ...state, theme: cookieTheme }), { sync: true });
  return true;
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === PERSONAL_SETTINGS_KEY && e.newValue) {
      try {
        const next = hydrateFromPartial(JSON.parse(e.newValue) as Partial<PersonalSettings>);
        if (coreEquals(state, next)) return;
        state = next;
        writeThemeCookie(state.theme);
        emit();
      } catch {
        /* ignore */
      }
    } else if (host?.cachedUserKey && e.key === host.cachedUserKey && e.newValue) {
      try {
        const cachedUser = JSON.parse(e.newValue) as { metadata?: unknown };
        syncSettingsFromMetadata(cachedUser?.metadata);
      } catch {
        /* ignore */
      }
    }
  });

  // Back/forward cache: another app may have updated metadata while we were
  // frozen — reload local cache so theme/language flip without a full remount.
  window.addEventListener("pageshow", (e) => {
    if (!e.persisted) return;
    reloadPersonalSettingsFromCache();
  });
}
