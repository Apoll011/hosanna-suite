// SPDX-License-Identifier: AGPL-3.0-only
/**
 * `@hosanna/ui` — shared primitives + RBAC helpers.
 *
 * Prefer `@hosanna/ui/permissions` when you only need RBAC (gates, hooks, provider).
 * Root remains a convenience barrel for existing app imports.
 */

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
export {
  AppSwitcher,
  type AppSwitcherApp,
  type AppSwitcherLabels,
  type AppSwitcherProps,
} from "./AppSwitcher";
export { Badge, type BadgeProps } from "./Badge";
export { Button, type ButtonProps } from "./Button";
export { CheckboxList, type CheckboxListItem } from "./CheckboxList";
export { cn, type ClassValue } from "./cn";
export { ConfirmDialog, type ConfirmDialogProps } from "./ConfirmDialog";
export { CommandPaletteProvider, useCommandPalette, type CommandAction } from "./CommandPaletteContext";
export {
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuSurface,
  type ContextMenuSurfaceProps,
} from "./ContextMenu";
export { EmptyState, type EmptyStateProps } from "./EmptyState";
export { FileDrop, type FileDropProps } from "./FileDrop";
export { GoogleTextField, type GoogleTextFieldProps } from "./GoogleTextField";
export {
  InboxButton,
  InboxPanel,
  inboxBadgeLabel,
  useInbox,
  type InboxButtonProps,
  type InboxFetchClient,
  type InboxNotification,
  type InboxPanelProps,
  type UseInboxOptions,
  type UseInboxReturn,
} from "./Inbox";
export { AppleIcon, DiscordIcon, GitHubIcon, GoogleIcon, MicrosoftIcon } from "./icons/SocialIcons";
export { Input, type InputProps } from "./Input";
export { HoldButton, type HoldButtonProps } from "./HoldButton";
export { LoadingBar, type LoadingBarProps } from "./LoadingBar";
export { MenuThemeToggle, type MenuThemeToggleProps, type MenuThemeValue } from "./MenuThemeToggle";
export { Modal, type ModalProps } from "./Modal";
export { NotificationChatBox, type NotificationChatBoxProps } from "./NotificationChatBox";
export { PageHeader, type PageHeaderProps } from "./PageHeader";
export { Spinner, type SpinnerProps } from "./Spinner";
export { SpringInput } from "./SpringInput";
export {
  clamp,
  createSpring,
  prefersReducedMotion,
  springPresets,
  stepSpring,
  tuneSpring,
  type SpringValue,
} from "./motion";
export {
  SpringDropdown,
  type SpringDropdownOption,
  type SpringDropdownProps,
} from "./SpringDropdown";
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
export { Surface, type SurfaceProps } from "./Surface";
export {
  WorkspaceFrame,
  WorkspaceHeader,
  WorkspaceMain,
  WorkspaceSidebar,
  WorkspaceSurface,
} from "./WorkspaceShell";
export { Tabs, type TabItem } from "./Tabs";
export { usePresence } from "./usePresence";

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

import "./global.css";
