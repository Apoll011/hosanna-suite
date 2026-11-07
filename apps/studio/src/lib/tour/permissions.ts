/**
 * Sync permission checks against the static role statements.
 * Used by the tour block composer (no network round-trip).
 */

import type { PermissionString } from "../permissions/permission";
import { roles, type AppRole } from "../permissions/roles";

export function roleHasPermission(
  role: AppRole,
  permission: PermissionString,
): boolean {
  const roleConfig = roles[role];
  if (!roleConfig) return false;

  const dotIndex = permission.indexOf(".");
  const resource = permission.slice(
    0,
    dotIndex,
  ) as keyof typeof roleConfig.statements;
  const action = permission.slice(dotIndex + 1);

  const allowedActions = roleConfig.statements[resource];
  return Array.isArray(allowedActions) && allowedActions.includes(action);
}

export function roleHasAnyPermission(
  role: AppRole,
  permissions: PermissionString[],
): boolean {
  return permissions.some((p) => roleHasPermission(role, p));
}
