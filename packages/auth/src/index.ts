export { ac, statement, toPermissionRequest } from "./authorization/permission.js";
export type {
  ActionFor,
  PermissionRequest,
  PermissionString,
  Resource,
} from "./authorization/permission.js";

export { admin, editor, guest, musician, owner, roles, teamLeader } from "./authorization/roles.js";
export type { AppRole } from "./authorization/roles.js";

export {
  DOMAINS,
  allDomainPermissions,
  domainForLogosKind,
  domainForPermissionResource,
  domainIdForPermission,
  getDomain,
  logosKindForDomain,
  permissionsForDomain,
} from "./authorization/domains.js";
export type { DomainDefinition, DomainId, SuiteAppId } from "./authorization/domains.js";

export {
  APP_ROLE_PERMISSIONS,
  permissionsForAppRole,
  permissionsForOrgRole,
  resolveEffectivePermissions,
} from "./authorization/appRoles.js";
export type { AppRoleId } from "./authorization/appRoles.js";

export { SUITE_APP_REGISTRY, getSuiteApp, getSuiteAppUrl, listSuiteApps } from "./suite/apps.js";
export type {
  SuiteAppDefinition,
  SuiteAppDto,
  SuiteAppLogoHost,
  SuiteAppStatus,
  SuiteAppUrlEnv,
} from "./suite/apps.js";

export {
  applySuiteAppAccent,
  brandTokensFromAccent,
  getSuiteAppAccent,
  getSuiteAppBrandTokens,
  suiteAppAccentCssVars,
  suiteAppAccentDarkCssVars,
  suiteAppAccentStyle,
} from "./suite/accent.js";
export type { SuiteAppBrandTokens } from "./suite/accent.js";

export { pluginLocaleOverrides } from "./i18n/plugin-locale-overrides.js";
export { RESPONSIBILITIES } from "./authorization/responsibilities.js";

export {
  CROSS_APP_KEYS,
  DEFAULT_PERSONAL_SETTINGS,
  PERSONAL_SETTINGS_KEY,
  THEME_BG,
  THEME_COOKIE,
  applyDocumentTheme,
  applyScopeMigrations,
  buildThemeBootScript,
  clearPersonalSettingsCache,
  configurePersonalSettings,
  createAppSettingsAccessor,
  defineAppSettingsScope,
  getAppSettings,
  getPersistedSettingsJson,
  getPersonalSettings,
  getRegisteredAppSettingsScope,
  getRegisteredAppSettingsScopes,
  isAppSettingsScopeRegistered,
  isCrossAppKey,
  mergeAppSettingsMaps,
  mergePersonalSettingsPreservingApps,
  parseSettingsJson,
  registerAppSettingsScope,
  reloadPersonalSettingsFromCache,
  resetPersonalSettings,
  resolveAppSettingsScope,
  resolveDarkMode,
  runThemeTransition,
  subscribeAppSettings,
  subscribePersonalSettings,
  syncSettingsFromMetadata,
  updateAppSetting,
  updateAppSettings,
  updateAppSettingsSafe,
  updatePersonalSetting,
  updatePersonalSettings,
  updatePersonalSettingsSafe,
  writeThemeCookie,
  type AppSettingsAccessor,
  type AppSettingsMap,
  type AppSettingsScope,
  type AppSettingsScopeId,
  type CrossAppKey,
  type PersonalLanguage,
  type PersonalSettings,
  type PersonalSettingsHost,
  type PersonalTheme,
} from "./personal-settings/index.js";
