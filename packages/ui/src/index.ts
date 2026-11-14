/**
 * `@hosanna/ui` — shared primitives + RBAC helpers.
 *
 * Prefer `@hosanna/ui/permissions` when you only need RBAC (gates, hooks, provider).
 * Root remains a convenience barrel for existing app imports.
 */

export { cn, type ClassValue } from "./cn";
export {
  AccountMenu,
  AccountMenuDivider,
  type AccountMenuHide,
  type AccountMenuLabels,
  type AccountMenuLink,
  type AccountMenuOrg,
  type AccountMenuProps,
  type AccountMenuTheme,
  type AccountMenuUser,
} from "./AccountMenu";
export { MenuThemeToggle, type MenuThemeToggleProps } from "./MenuThemeToggle";
export {
  AppSwitcher,
  type AppSwitcherApp,
  type AppSwitcherLabels,
  type AppSwitcherProps,
} from "./AppSwitcher";
export { SuiteAppIcon, type SuiteAppIconProps } from "./SuiteAppIcon";
export {
  loadSuiteApps,
  peekSuiteAppsCache,
  resetSuiteAppsCacheForTests,
  type SuiteCatalogApp,
} from "./suiteAppsCache";
export {
  localizeSuiteApp,
  localizeSuiteApps,
  resolveSuiteAppLabel,
  type SuiteAppLabelField,
  type SuiteAppLocalizable,
} from "./suiteLabels";
export { Badge, type BadgeProps } from "./Badge";
export { Button, type ButtonProps } from "./Button";
export { ConfirmDialog, type ConfirmDialogProps } from "./ConfirmDialog";
export { EmptyState, type EmptyStateProps } from "./EmptyState";
export { GoogleTextField, type GoogleTextFieldProps } from "./GoogleTextField";
export { AppleIcon, DiscordIcon, GitHubIcon, GoogleIcon, MicrosoftIcon } from "./icons/SocialIcons";
export { Input, type InputProps } from "./Input";
export { Modal, type ModalProps } from "./Modal";
export { PageHeader, type PageHeaderProps } from "./PageHeader";
export { Spinner, type SpinnerProps } from "./Spinner";
export { LoadingBar, type LoadingBarProps } from "./LoadingBar";
export { Surface, type SurfaceProps } from "./Surface";
export { Tabs, type TabItem } from "./Tabs";

export {
  AnyRoleGate,
  Can,
  CanAll,
  CanAny,
  Cannot,
  PermissionsProvider,
  RoleGate,
  RoleSwitch,
  checkPermissionAnyLocally,
  checkPermissionsLocally,
  clearPermissionCache,
  groupPermissions,
  preloadPermissionsForRole,
  useActiveRole,
  useAnyRole,
  useCan,
  useCanAll,
  useCanAny,
  useCannot,
  usePermissionValue,
  usePermissionsContext,
  usePreloadPermissions,
  useRole,
  withPermission,
  withRole,
  type PermissionsContextValue,
  type PermissionsProviderProps,
} from "./permissions";
