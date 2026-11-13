/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Thin React binding over `@hosanna/auth` personal-settings store.
 */

import {
  DEFAULT_PERSONAL_SETTINGS,
  NEW_USER_TOUR_SETTINGS,
  clearPersonalSettingsCache,
  configurePersonalSettings,
  getPersistedSettingsJson,
  getPersonalSettings,
  reloadPersonalSettingsFromCache,
  resetPersonalSettings,
  shouldAutoStartProductTour,
  shouldOfferMissedProductTour,
  subscribePersonalSettings,
  syncSettingsFromMetadata,
  updatePersonalSetting,
  type ExplorerDensity,
  type PersonalSettings,
  type PersonalTheme,
  type SongScoreLayout,
  type ViewMode,
} from "@hosanna/auth";
import { useCallback, useSyncExternalStore } from "react";

import { CACHED_USER_KEY } from "../lib/authSessionCache";
import { authClient } from "../lib/authClient";

export type {
  ExplorerDensity,
  PersonalSettings,
  PersonalTheme,
  SongScoreLayout,
  ViewMode,
};

export {
  DEFAULT_PERSONAL_SETTINGS as DEFAULT_SETTINGS,
  NEW_USER_TOUR_SETTINGS,
  clearPersonalSettingsCache,
  getPersistedSettingsJson,
  reloadPersonalSettingsFromCache,
  shouldAutoStartProductTour,
  shouldOfferMissedProductTour,
  syncSettingsFromMetadata,
};

let configured = false;
function ensureConfigured() {
  if (configured || typeof window === "undefined") return;
  configured = true;
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
