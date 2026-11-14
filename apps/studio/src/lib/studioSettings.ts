/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Studio-scoped personal settings (`apps.studio`) — registered on the shared
 * `@hosanna/auth` personal-settings store.
 */

import {
  createAppSettingsAccessor,
  defineAppSettingsScope,
  registerAppSettingsScope,
} from "@hosanna/auth";
import { useCallback, useSyncExternalStore } from "react";

export type ViewMode = "grid" | "list";
export type ExplorerDensity = "comfortable" | "compact";
export type SongScoreLayout = "ring" | "bar" | "dots" | "badge";

export type StudioSettings = {
  showFolderTree: boolean;
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
};

export const DEFAULT_STUDIO_SETTINGS: StudioSettings = {
  showFolderTree: true,
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
  StudioSettings,
  "productTourCompleted" | "productTourDismissedAt" | "interactiveOnboardingCompleted"
> = {
  productTourCompleted: false,
  productTourDismissedAt: null,
  interactiveOnboardingCompleted: false,
};

const LEGACY_LOCAL_KEYS = {
  showChordsDefault: "@hosanna:showChordsDefault",
  sidebarCollapsed: "sidebarCollapsed",
  viewMode: "viewMode",
  explorerDensity: "explorer_density",
} as const;

const FLAT_ROOT_KEYS = [
  "showFolderTree",
  "showChordsDefault",
  "sidebarCollapsed",
  "viewMode",
  "explorerDensity",
  "showSongScore",
  "songScoreLayout",
  "productTourCompleted",
  "productTourDismissedAt",
  "interactiveOnboardingCompleted",
] as const;

function readLegacyLocal(): Partial<StudioSettings> {
  if (typeof window === "undefined") return {};
  const out: Partial<StudioSettings> = {};
  try {
    const chords = localStorage.getItem(LEGACY_LOCAL_KEYS.showChordsDefault);
    if (chords !== null) out.showChordsDefault = chords === "true";
    const collapsed = localStorage.getItem(LEGACY_LOCAL_KEYS.sidebarCollapsed);
    if (collapsed !== null) out.sidebarCollapsed = collapsed === "true";
    const viewMode = localStorage.getItem(LEGACY_LOCAL_KEYS.viewMode);
    if (viewMode === "grid" || viewMode === "list") out.viewMode = viewMode;
    const density = localStorage.getItem(LEGACY_LOCAL_KEYS.explorerDensity);
    if (density === "comfortable" || density === "compact") out.explorerDensity = density;
  } catch {
    /* private mode */
  }
  return out;
}

function clearLegacyLocal(): void {
  if (typeof window === "undefined") return;
  try {
    Object.values(LEGACY_LOCAL_KEYS).forEach((key) => localStorage.removeItem(key));
  } catch {
    /* ignore */
  }
}

function migrateFromRoot(root: Record<string, unknown>): Partial<StudioSettings> {
  const fromFlat: Partial<StudioSettings> = {};
  for (const key of FLAT_ROOT_KEYS) {
    if (key in root && root[key] !== undefined) {
      (fromFlat as Record<string, unknown>)[key] = root[key];
    }
  }
  const fromLocal = readLegacyLocal();
  const merged = { ...fromLocal, ...fromFlat };
  if (Object.keys(merged).length > 0) {
    clearLegacyLocal();
  }
  return merged;
}

export const studioSettingsScope = defineAppSettingsScope<StudioSettings>({
  id: "studio",
  defaults: DEFAULT_STUDIO_SETTINGS,
  migrateFromRoot,
});

/** Idempotent — safe to call from multiple boot paths. */
export function ensureStudioSettingsRegistered(): void {
  registerAppSettingsScope(studioSettingsScope);
}

// Register as soon as Studio loads this module so accessors never see a missing scope.
ensureStudioSettingsRegistered();

export const studioSettings = createAppSettingsAccessor(studioSettingsScope);

export function shouldAutoStartProductTour(settings: StudioSettings): boolean {
  return settings.productTourCompleted === false && !settings.productTourDismissedAt;
}

export function shouldOfferMissedProductTour(settings: StudioSettings): boolean {
  return settings.productTourCompleted === null;
}

export function useStudioSettings() {
  ensureStudioSettingsRegistered();
  const settings = useSyncExternalStore(
    studioSettings.subscribe,
    studioSettings.get,
    () => DEFAULT_STUDIO_SETTINGS,
  );

  const updateSetting = useCallback(
    <K extends keyof StudioSettings>(key: K, value: StudioSettings[K]) => {
      studioSettings.setKey(key, value);
    },
    [],
  );

  const updateSettings = useCallback((patch: Partial<StudioSettings>) => {
    studioSettings.set(patch);
  }, []);

  return { settings, updateSetting, updateSettings };
}
