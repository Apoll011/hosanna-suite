/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Thin React binding over `@hosanna/auth` personal-settings store (core:
 * theme + language). Studio-scoped prefs live in `../lib/studioSettings`.
 */

import {
  DEFAULT_PERSONAL_SETTINGS,
  clearPersonalSettingsCache,
  configurePersonalSettings,
  getPersistedSettingsJson,
  getPersonalSettings,
  reloadPersonalSettingsFromCache,
  resetPersonalSettings,
  subscribePersonalSettings,
  syncSettingsFromMetadata,
  updatePersonalSetting,
  type PersonalSettings,
  type PersonalTheme,
} from "@hosanna/auth";
import { useCallback, useSyncExternalStore } from "react";

import { CACHED_USER_KEY } from "../lib/authSessionCache";
import { authClient } from "../lib/authClient";
import { ensureStudioSettingsRegistered } from "../lib/studioSettings";

export type { PersonalSettings, PersonalTheme };

export {
  DEFAULT_PERSONAL_SETTINGS as DEFAULT_SETTINGS,
  clearPersonalSettingsCache,
  getPersistedSettingsJson,
  reloadPersonalSettingsFromCache,
  syncSettingsFromMetadata,
};

// Re-export Studio scope helpers so existing tour imports keep working.
export {
  DEFAULT_STUDIO_SETTINGS,
  NEW_USER_TOUR_SETTINGS,
  shouldAutoStartProductTour,
  shouldOfferMissedProductTour,
  useStudioSettings,
  type ExplorerDensity,
  type SongScoreLayout,
  type StudioSettings,
  type ViewMode,
} from "../lib/studioSettings";

let configured = false;
function ensureConfigured() {
  if (configured || typeof window === "undefined") return;
  configured = true;
  ensureStudioSettingsRegistered();
  configurePersonalSettings({
    cachedUserKey: CACHED_USER_KEY,
    updateUserMetadata: async (metadataJson) => {
      await (authClient.updateUser as unknown as (params: { metadata: string }) => Promise<unknown>)(
        {
          metadata: metadataJson,
        },
      );
    },
  });
}

ensureConfigured();

export function usePersonalSettings() {
  ensureConfigured();
  const settings = useSyncExternalStore(
    subscribePersonalSettings,
    getPersonalSettings,
    () => DEFAULT_PERSONAL_SETTINGS,
  );

  const updateSetting = useCallback(
    <K extends keyof PersonalSettings>(key: K, value: PersonalSettings[K]) => {
      updatePersonalSetting(key, value);
    },
    [],
  );

  const resetSettings = useCallback(() => resetPersonalSettings(), []);

  return { settings, updateSetting, resetSettings };
}
