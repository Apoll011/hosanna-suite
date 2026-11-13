/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Cached personal settings store — localStorage + Better Auth user.metadata.
 */

import {
  CROSS_APP_KEYS,
  DEFAULT_PERSONAL_SETTINGS,
  PERSONAL_SETTINGS_KEY,
  type CrossAppKey,
  type PersonalLanguage,
  type PersonalSettings,
  type PersonalTheme,
} from "./types.js";
import { writeThemeCookie } from "./theme.js";

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

const LEGACY_KEYS = {
  theme: "chordpro_theme",
  authTheme: "hosanna_auth_theme",
  authLanguage: "hosanna_auth_language",
  showChordsDefault: "@hosanna:showChordsDefault",
  sidebarCollapsed: "sidebarCollapsed",
  viewMode: "viewMode",
  explorerDensity: "explorer_density",
} as const;

type Listener = () => void;
const listeners = new Set<Listener>();

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let state: PersonalSettings = loadSettings();

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

export function shouldAutoStartProductTour(settings: PersonalSettings): boolean {
  return settings.productTourCompleted === false && !settings.productTourDismissedAt;
}

export function shouldOfferMissedProductTour(settings: PersonalSettings): boolean {
  return settings.productTourCompleted === null;
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

function loadSettings(): PersonalSettings {
  const settings: PersonalSettings = { ...DEFAULT_PERSONAL_SETTINGS };
  if (typeof window === "undefined") return settings;

  try {
    const stored = localStorage.getItem(PERSONAL_SETTINGS_KEY);
    const parsedStored = parseSettingsJson(stored);
    if (parsedStored) Object.assign(settings, parsedStored);

    const hasLocalSettings = Boolean(parsedStored);
    if (!hasLocalSettings && host?.cachedUserKey) {
      try {
        const cachedUserStr = localStorage.getItem(host.cachedUserKey);
        if (cachedUserStr) {
          const cachedUser = JSON.parse(cachedUserStr) as { metadata?: unknown };
          const parsedMetadata = parseSettingsJson(cachedUser?.metadata);
          if (parsedMetadata) Object.assign(settings, parsedMetadata);
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
    if (legacyLang === "pt" || legacyLang === "en" || legacyLang === "es" || legacyLang === "auto") {
      settings.language = legacyLang;
      migrated = true;
    }
    const legacyChords = localStorage.getItem(LEGACY_KEYS.showChordsDefault);
    if (legacyChords !== null) {
      settings.showChordsDefault = legacyChords === "true";
      migrated = true;
    }
    const legacyCollapsed = localStorage.getItem(LEGACY_KEYS.sidebarCollapsed);
    if (legacyCollapsed !== null) {
      settings.sidebarCollapsed = legacyCollapsed === "true";
      migrated = true;
    }
    const legacyViewMode = localStorage.getItem(LEGACY_KEYS.viewMode);
    if (legacyViewMode === "grid" || legacyViewMode === "list") {
      settings.viewMode = legacyViewMode;
      migrated = true;
    }
    const legacyDensity = localStorage.getItem(LEGACY_KEYS.explorerDensity);
    if (legacyDensity === "comfortable" || legacyDensity === "compact") {
      settings.explorerDensity = legacyDensity;
      migrated = true;
    }

    const theme = normalizeTheme(settings.theme);
    const language = normalizeLanguage(settings.language);
    if (theme) settings.theme = theme;
    if (language) settings.language = language;

    if (migrated) {
      localStorage.setItem(PERSONAL_SETTINGS_KEY, JSON.stringify(settings));
      Object.values(LEGACY_KEYS).forEach((key) => localStorage.removeItem(key));
    }
  } catch {
    /* private mode */
  }
  return settings;
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
    console.warn("[personal-settings] configurePersonalSettings() was not called; skip metadata sync");
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

function persistSettings(newSettings: PersonalSettings, opts?: { sync?: boolean }) {
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

function setState(updater: (prev: PersonalSettings) => PersonalSettings, opts?: { sync?: boolean }) {
  persistSettings(updater(state), opts);
}

/**
 * Hydrate / reconcile from Better Auth `user.metadata`.
 *
 * - If there is no local cache yet → full hydrate (login / new origin).
 * - If local exists → still apply **cross-app** keys (`theme`, `language`) so
 *   changes made on Studio show up on Auth (and vice versa) without waiting
 *   for a wiped localStorage.
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
    const merged = { ...DEFAULT_PERSONAL_SETTINGS, ...parsed };
    const theme = normalizeTheme(merged.theme);
    const language = normalizeLanguage(merged.language);
    if (theme) merged.theme = theme;
    if (language) merged.language = language;
    persistSettings(merged, { sync: false });
    return {
      themeChanged: merged.theme !== prevTheme,
      languageChanged: merged.language !== prevLanguage,
    };
  }

  const patch: Partial<PersonalSettings> = {};
  for (const key of CROSS_APP_KEYS) {
    if (key === "theme") {
      const theme = normalizeTheme(parsed.theme);
      if (theme) patch.theme = theme;
    } else if (key === "language") {
      const language = normalizeLanguage(parsed.language);
      if (language) patch.language = language;
    }
  }

  if (Object.keys(patch).length === 0) {
    return { themeChanged: false, languageChanged: false };
  }

  const merged = { ...state, ...patch };
  const themeChanged = merged.theme !== prevTheme;
  const languageChanged = merged.language !== prevLanguage;
  if (!themeChanged && !languageChanged) {
    return { themeChanged: false, languageChanged: false };
  }

  persistSettings(merged, { sync: false });
  return { themeChanged, languageChanged };
}

export function updatePersonalSetting<K extends keyof PersonalSettings>(
  key: K,
  value: PersonalSettings[K],
): void {
  setState((prev) => ({ ...prev, [key]: value }));
}

export function updatePersonalSettings(patch: Partial<PersonalSettings>): PersonalSettings {
  setState((prev) => ({ ...prev, ...patch }));
  return state;
}

/**
 * Merge with latest server metadata before patching so Auth cannot wipe
 * Studio-only keys (and the reverse).
 */
export async function updatePersonalSettingsSafe(
  patch: Partial<PersonalSettings>,
  opts?: { readRemoteMetadata?: () => Promise<unknown> },
): Promise<PersonalSettings> {
  if (opts?.readRemoteMetadata) {
    try {
      const remote = parseSettingsJson(await opts.readRemoteMetadata());
      if (remote) {
        state = { ...DEFAULT_PERSONAL_SETTINGS, ...remote, ...state };
      }
    } catch {
      /* keep local */
    }
  }
  return updatePersonalSettings(patch);
}

export function resetPersonalSettings(): void {
  setState(() => ({ ...DEFAULT_PERSONAL_SETTINGS }));
}

/** Drop the device cache (call on logout). Next login hydrates from metadata. */
export function clearPersonalSettingsCache(): void {
  try {
    localStorage.removeItem(PERSONAL_SETTINGS_KEY);
  } catch {
    /* ignore */
  }
  state = { ...DEFAULT_PERSONAL_SETTINGS };
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
  state = loadSettings();
  writeThemeCookie(state.theme);
  emit();
  return state;
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === PERSONAL_SETTINGS_KEY && e.newValue) {
      try {
        state = { ...DEFAULT_PERSONAL_SETTINGS, ...JSON.parse(e.newValue) };
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
