// SPDX-License-Identifier: AGPL-3.0-only
import { roles, type AppRole } from "./roles.js";
import { toPermissionRequest, type PermissionString } from "./permission.js";

export type TeamAction = "create" | "update" | "delete";

export function canManageTeam(opts: {
  role: AppRole | string | null | undefined;
  action: TeamAction;
  isTeamMember?: boolean;
}): boolean {
  if (!opts.role) return false;
  const normalizedRole = opts.role.toLowerCase().replaceAll(/[_-]/g, "");
  const roleName = normalizedRole === "teamleader" ? "teamLeader" : normalizedRole;
  if (!(roleName in roles)) return false;
  const appRole = roleName as AppRole;
  const role = roles[appRole];
  const permission = `team.${opts.action}` satisfies PermissionString;
  if (!role.authorize(toPermissionRequest(permission)).success) return false;
  if (appRole === "teamLeader" && opts.action !== "create") {
    return opts.isTeamMember === true;
  }
  return true;
}
