/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export {
  PermissionsProvider,
  usePermissionsContext,
  type PermissionsContextValue,
  type PermissionsProviderProps,
} from "./provider";

export {
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
  usePreloadPermissions,
  useRole,
} from "./client";

export {
  AnyRoleGate,
  Can,
  CanAll,
  CanAny,
  Cannot,
  RoleGate,
  RoleSwitch,
  withPermission,
  withRole,
} from "./components";
