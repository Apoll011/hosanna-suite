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
