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

export {
  SUITE_APP_REGISTRY,
  getSuiteApp,
  getSuiteAppUrl,
  listSuiteApps,
} from "./suite/apps.js";
export type {
  SuiteAppDefinition,
  SuiteAppDto,
  SuiteAppStatus,
  SuiteAppUrlEnv,
} from "./suite/apps.js";

export { pluginLocaleOverrides } from "./i18n/plugin-locale-overrides.js";
export { RESPONSIBILITIES } from "./authorization/responsibilities.js";

export {
  CROSS_APP_KEYS,
  DEFAULT_PERSONAL_SETTINGS,
  NEW_USER_TOUR_SETTINGS,
  PERSONAL_SETTINGS_KEY,
  THEME_BG,
  THEME_COOKIE,
  applyDocumentTheme,
  buildThemeBootScript,
  clearPersonalSettingsCache,
  configurePersonalSettings,
  getPersistedSettingsJson,
  getPersonalSettings,
  isCrossAppKey,
  parseSettingsJson,
  reloadPersonalSettingsFromCache,
  resetPersonalSettings,
  resolveDarkMode,
  runThemeTransition,
  shouldAutoStartProductTour,
  shouldOfferMissedProductTour,
  subscribePersonalSettings,
  syncSettingsFromMetadata,
  updatePersonalSetting,
  updatePersonalSettings,
  updatePersonalSettingsSafe,
  writeThemeCookie,
  type CrossAppKey,
  type ExplorerDensity,
  type PersonalLanguage,
  type PersonalSettings,
  type PersonalSettingsHost,
  type PersonalTheme,
  type SongScoreLayout,
  type ViewMode,
} from "./personal-settings/index.js";
