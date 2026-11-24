import { roles, toPermissionRequest, type AppRole } from "./roles.js";
import type { PermissionString } from "./permission.js";

export type TeamAction = "create" | "update" | "delete";

export function canManageTeam(opts: {
  role: AppRole | string | null | undefined;
  action: TeamAction;
  isTeamMember?: boolean;
}): boolean {
  if (!opts.role || !(opts.role in roles)) return false;
  const role = roles[opts.role as AppRole];
  const permission = `team.${opts.action}` satisfies PermissionString;
  if (!role.authorize(toPermissionRequest(permission)).success) return false;
  if (opts.role === "teamLeader" && opts.action !== "create") {
    return opts.isTeamMember === true;
  }
  return true;
}
