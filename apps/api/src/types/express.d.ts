import type { AppRole } from "@hosanna/auth";
import type { OrgScopedPrisma } from "../database/prisma.js";

/** Request-scoped identity after `authenticate` — `role` is the org member role. */
export interface AuthorizedUser {
  id: string;
  workspaceId: string;
  /** Organization membership role (`owner` / `admin` / …), never admin-plugin `user.role`. */
  role: AppRole;
  teamId?: string;
}

declare global {
  namespace Express {
    interface Request {
      orgId?: string; //same as workspaceId
      db?: OrgScopedPrisma;
      user?: AuthorizedUser;
      /** BCP-47 locale resolved from the active organisation's settings. */
      locale: string;
    }
  }
}

export {};
