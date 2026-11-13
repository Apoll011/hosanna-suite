/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export {
  CROSS_APP_KEYS,
  DEFAULT_PERSONAL_SETTINGS,
  NEW_USER_TOUR_SETTINGS,
  PERSONAL_SETTINGS_KEY,
  THEME_COOKIE,
  type CrossAppKey,
  type ExplorerDensity,
  type PersonalLanguage,
  type PersonalSettings,
  type PersonalTheme,
  type SongScoreLayout,
  type ViewMode,
} from "./types.js";

export {
  clearPersonalSettingsCache,
  configurePersonalSettings,
  getPersistedSettingsJson,
  getPersonalSettings,
  isCrossAppKey,
  parseSettingsJson,
  reloadPersonalSettingsFromCache,
  resetPersonalSettings,
  shouldAutoStartProductTour,
  shouldOfferMissedProductTour,
  subscribePersonalSettings,
  syncSettingsFromMetadata,
  updatePersonalSetting,
  updatePersonalSettings,
  updatePersonalSettingsSafe,
  type PersonalSettingsHost,
} from "./store.js";

export {
  THEME_BG,
  applyDocumentTheme,
  buildThemeBootScript,
  resolveDarkMode,
  runThemeTransition,
  writeThemeCookie,
} from "./theme.js";
