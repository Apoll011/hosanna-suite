/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useSyncExternalStore } from "react";
import { CACHED_USER_KEY, SessionUser } from "../contexts/AuthContext";
import { authClient } from "../lib/authClient";
import { PersonalLanguage } from "../lib/i18n/types";

export type PersonalTheme = "light" | "dark" | "system";
export type ViewMode = "grid" | "list";
export type ExplorerDensity = "comfortable" | "compact";
export type SongScoreLayout = "ring" | "bar" | "dots" | "badge";

/**
 * Single source of truth for every user-level preference. All of these were
 * previously scattered across separate `localStorage` keys (theme, language,
 * navigation, studio settings); they are now consolidated here under one key.
 */
export interface PersonalSettings {
  showFolderTree: boolean;
  /** UI language preference. `"auto"` follows org → browser → default. */
  language: PersonalLanguage;
  theme: PersonalTheme;
  showChordsDefault: boolean;
  sidebarCollapsed: boolean;
  viewMode: ViewMode;
  explorerDensity: ExplorerDensity;
  showSongScore: boolean;
  songScoreLayout: SongScoreLayout;
  /**
   * Product tour state.
   * - `null` — legacy user (flag never written) → offer “missed tour” once
   * - `false` — new user / not completed → auto-start when eligible
   * - `true` — finished the product tour
   */
  productTourCompleted: boolean | null;
  /** ISO timestamp when the user dismissed/skipped the product tour offer. */
  productTourDismissedAt: string | null;
  /** Interactive (sandbox) onboarding completed. */
  interactiveOnboardingCompleted: boolean;
}

export const DEFAULT_SETTINGS: PersonalSettings = {
  showFolderTree: true,
  language: "auto",
  theme: "light",
  showChordsDefault: true,
  sidebarCollapsed: false,
  viewMode: "grid",
  explorerDensity: "comfortable",
  showSongScore: true,
  songScoreLayout: "ring",
  productTourCompleted: null,
  productTourDismissedAt: null,
  interactiveOnboardingCompleted: false,
};

/** New accounts start with an explicit pending tour (not the legacy `null`). */
export const NEW_USER_TOUR_SETTINGS: Pick<
  PersonalSettings,
  | "productTourCompleted"
  | "productTourDismissedAt"
  | "interactiveOnboardingCompleted"
> = {
  productTourCompleted: false,
  productTourDismissedAt: null,
  interactiveOnboardingCompleted: false,
};

export function shouldAutoStartProductTour(
  settings: PersonalSettings,
): boolean {
  return (
    settings.productTourCompleted === false && !settings.productTourDismissedAt
  );
}

export function shouldOfferMissedProductTour(
  settings: PersonalSettings,
): boolean {
  return settings.productTourCompleted === null;
}

const STORAGE_KEY = "personal-settings";

/** Current local settings JSON, if any. Prefer this over lagging session metadata. */
export function getPersistedSettingsJson(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Legacy keys from before the consolidation. Read once so existing users keep
 * their preferences, then removed in favour of the unified store.
 */
const LEGACY_KEYS = {
  theme: "chordpro_theme",
  showChordsDefault: "@hosanna:showChordsDefault",
  sidebarCollapsed: "sidebarCollapsed",
  viewMode: "viewMode",
  explorerDensity: "explorer_density",
} as const;

function parseSettingsJson(raw: unknown): Partial<PersonalSettings> | null {
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

function loadSettings(): PersonalSettings {
  const settings: PersonalSettings = { ...DEFAULT_SETTINGS };
  try {
    // 1. Read the local snapshot first because it is written synchronously.
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsedStored = parseSettingsJson(stored);
    if (parsedStored) Object.assign(settings, parsedStored);

    // 2. Fall back to cached auth metadata when no local snapshot exists.
    const hasLocalSettings = Boolean(parsedStored);
    const cachedUserStr = localStorage.getItem(CACHED_USER_KEY);
    if (cachedUserStr && !hasLocalSettings) {
      try {
        const cachedUser = JSON.parse(cachedUserStr) as SessionUser;
        const parsedMetadata = parseSettingsJson(cachedUser?.metadata);
        if (parsedMetadata) {
          Object.assign(settings, parsedMetadata);
        }
      } catch {
        // ignore invalid cached user
      }
    }

    // One-time migration from legacy scattered keys.
    let migrated = false;
    const legacyTheme = localStorage.getItem(LEGACY_KEYS.theme);
    if (
      legacyTheme === "light" ||
      legacyTheme === "dark" ||
      legacyTheme === "system"
    ) {
      settings.theme = legacyTheme;
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

    if (migrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      Object.values(LEGACY_KEYS).forEach((key) => localStorage.removeItem(key));
    }
  } catch {
    // ignore unavailable/corrupt storage
  }
  return settings;
}

// Module-level store: syncs state across all component instances instantly
let state: PersonalSettings = loadSettings();
const listeners = new Set<() => void>();

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

async function syncMetadataToServer(settingsToSave: PersonalSettings) {
  const serialized = JSON.stringify(settingsToSave);

  // Update cached user in localStorage immediately so offline/refresh remains consistent
  try {
    const cachedUserStr = localStorage.getItem(CACHED_USER_KEY);
    if (cachedUserStr) {
      const cachedUser = JSON.parse(cachedUserStr) as SessionUser;
      cachedUser.metadata = serialized;
      localStorage.setItem(CACHED_USER_KEY, JSON.stringify(cachedUser));
    }
  } catch {
    // ignore storage errors
  }

  // Persist to better-auth backend
  try {
    await (
      authClient.updateUser as unknown as (params: {
        metadata: string;
      }) => Promise<unknown>
    )({
      metadata: serialized,
    });
  } catch (err) {
    console.warn("Failed to persist personal settings to user metadata:", err);
  }
}

function persistSettings(newSettings: PersonalSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
  } catch {
    // localStorage unavailable or full — silently ignore
  }

  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    void syncMetadataToServer(newSettings);
  }, 300);
}

function setState(updater: (prev: PersonalSettings) => PersonalSettings) {
  state = updater(state);
  persistSettings(state);
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return state;
}

/**
 * Hydrates the in-memory store from user metadata (session fetch / login).
 *
 * Local `personal-settings` is the device source of truth once it exists —
 * every edit writes it synchronously, while session metadata can lag behind
 * `updateUser` and briefly regress the UI if applied on every refetch.
 * Logout clears localStorage, so the next login still hydrates from metadata.
 */
export function syncSettingsFromMetadata(metadata: unknown) {
  try {
    if (localStorage.getItem(STORAGE_KEY)) return;
  } catch {
    // storage unavailable — fall through and try metadata
  }

  const parsed = parseSettingsJson(metadata);
  if (parsed) {
    const merged = { ...DEFAULT_SETTINGS, ...parsed };
    if (JSON.stringify(merged) !== JSON.stringify(state)) {
      state = merged;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // ignore
      }
      listeners.forEach((l) => l());
    }
  }
}

// Sync across open browser tabs/windows
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        state = { ...DEFAULT_SETTINGS, ...JSON.parse(e.newValue) };
        listeners.forEach((l) => l());
      } catch {
        // ignore invalid JSON from another tab
      }
    } else if (e.key === CACHED_USER_KEY && e.newValue) {
      try {
        const cachedUser = JSON.parse(e.newValue) as SessionUser;
        syncSettingsFromMetadata(cachedUser?.metadata);
      } catch {
        // ignore invalid JSON
      }
    }
  });
}

export function usePersonalSettings() {
  const settings = useSyncExternalStore(subscribe, getSnapshot);

  const updateSetting = useCallback(
    <K extends keyof PersonalSettings>(key: K, value: PersonalSettings[K]) => {
      setState((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const resetSettings = useCallback(() => setState(() => DEFAULT_SETTINGS), []);

  return { settings, updateSetting, resetSettings };
}
