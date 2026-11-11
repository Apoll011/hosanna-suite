/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Per-app role scaffold (FUTURE_DIRECTION). Org roles (owner/admin/…) stay in
 * `roles.ts`. App roles grant extra domain permissions when assigned on invite.
 *
 * Example (not enabled yet — Finance ships later):
 *   finance.treasurer → fund.access, fund.update, …
 */

import type { AppRole } from "./roles.js";
import { roles } from "./roles.js";
import type { PermissionString } from "./permission.js";
import { toPermissionRequest } from "./permission.js";
import type { SuiteAppId } from "./domains.js";
import { allDomainPermissions } from "./domains.js";

/** `finance.treasurer`, `planning.lead`, … — assigned alongside org role later. */
export type AppRoleId = `${SuiteAppId}.${string}`;

/**
 * Reserved app-role → permission grants.
 * Empty until product domains ship (Finance, etc.). Shape is stable for packs.
 */
export const APP_ROLE_PERMISSIONS: Readonly<Partial<Record<AppRoleId, readonly PermissionString[]>>> =
  {
    // Reserved — enable when Finance domain permissions exist:
    // "finance.treasurer": ["fund.access", "fund.create", "fund.update", "fund.delete"],
  };

export function permissionsForAppRole(appRole: AppRoleId): PermissionString[] {
  return [...(APP_ROLE_PERMISSIONS[appRole] ?? [])];
}

/** Org-role permissions as concrete PermissionString list. */
export function permissionsForOrgRole(orgRole: AppRole): PermissionString[] {
  const role = roles[orgRole];
  if (!role) return [];
  return allDomainPermissions().filter((p) => role.authorize(toPermissionRequest(p)).success);
}

/**
 * Effective permissions = org role ∪ app roles.
 * `appRoles` is unused in production until invite stores per-app roles;
 * discovery already returns the field so clients can adopt it.
 */
export function resolveEffectivePermissions(opts: {
  orgRole: AppRole | string | null | undefined;
  appRoles?: readonly AppRoleId[] | null;
}): {
  allowed: PermissionString[];
  denied: PermissionString[];
  orgRole: string | null;
  appRoles: AppRoleId[];
} {
  const orgRole =
    opts.orgRole && opts.orgRole in roles ? (opts.orgRole as AppRole) : null;
  const appRoles = [...(opts.appRoles ?? [])];

  const allowedSet = new Set<PermissionString>();
  if (orgRole) {
    for (const p of permissionsForOrgRole(orgRole)) allowedSet.add(p);
  }
  for (const ar of appRoles) {
    for (const p of permissionsForAppRole(ar)) allowedSet.add(p);
  }

  const all = allDomainPermissions();
  const allowed = all.filter((p) => allowedSet.has(p));
  const denied = all.filter((p) => !allowedSet.has(p));

  return { allowed, denied, orgRole, appRoles };
}
