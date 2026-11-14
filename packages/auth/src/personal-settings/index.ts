/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export {
  CROSS_APP_KEYS,
  DEFAULT_PERSONAL_SETTINGS,
  PERSONAL_SETTINGS_KEY,
  THEME_COOKIE,
  type AppSettingsMap,
  type CrossAppKey,
  type PersonalLanguage,
  type PersonalSettings,
  type PersonalTheme,
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
  subscribePersonalSettings,
  syncSettingsFromMetadata,
  syncThemeFromSharedCookie,
  updatePersonalSetting,
  updatePersonalSettings,
  updatePersonalSettingsSafe,
  type PersonalSettingsHost,
} from "./store.js";

export {
  applyScopeMigrations,
  createAppSettingsAccessor,
  defineAppSettingsScope,
  getAppSettings,
  getRegisteredAppSettingsScope,
  getRegisteredAppSettingsScopes,
  isAppSettingsScopeRegistered,
  mergeAppSettingsMaps,
  mergePersonalSettingsPreservingApps,
  registerAppSettingsScope,
  resolveAppSettingsScope,
  subscribeAppSettings,
  updateAppSetting,
  updateAppSettings,
  updateAppSettingsSafe,
  type AppSettingsAccessor,
  type AppSettingsScope,
  type AppSettingsScopeId,
} from "./scopes.js";

export {
  THEME_BG,
  applyDocumentTheme,
  buildThemeBootScript,
  readThemeCookie,
  resolveDarkMode,
  runThemeTransition,
  writeThemeCookie,
} from "./theme.js";
