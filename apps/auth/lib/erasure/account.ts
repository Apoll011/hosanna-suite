// SPDX-License-Identifier: AGPL-3.0-only
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";

export interface SoleOwnerOrg {
  id: string;
  name: string;
  slug: string;
}

export interface AccountErasureBlockedResult {
  blocked: true;
  reason: "sole_owner";
  orgs: SoleOwnerOrg[];
}

export interface AccountErasureResult {
  deleted: true;
}

export type AccountErasureOutcome = AccountErasureBlockedResult | AccountErasureResult;

async function findSoleOwnerOrgs(userId: string): Promise<SoleOwnerOrg[]> {
  const ownerships = await prisma.member.findMany({
    where: { userId, role: "owner" },
    select: { organizationId: true },
  });

  const soleOwnerOrgs: SoleOwnerOrg[] = [];

  for (const { organizationId } of ownerships) {
    const ownerCount = await prisma.member.count({
      where: { organizationId, role: "owner" },
    });
    if (ownerCount === 1) {
      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { id: true, name: true, slug: true },
      });
      if (org) soleOwnerOrgs.push(org);
    }
  }

  return soleOwnerOrgs;
}

export async function eraseAccount(userId: string): Promise<AccountErasureOutcome> {
  // 1. Block if the user is the sole owner of any org.
  const soleOwnerOrgs = await findSoleOwnerOrgs(userId);
  if (soleOwnerOrgs.length > 0) {
    return { blocked: true, reason: "sole_owner", orgs: soleOwnerOrgs };
  }

  // 2. Revoke all sessions (clears Redis + Postgres session rows).
  try {
    await auth.api.revokeUserSessions({
      headers: await headers(),
      body: { userId },
    });
  } catch (err) {
    console.error("[erasure] session revocation failed:", err);
  }

  // 3. Delete the user. Better Auth cascades sessions, accounts, 2FA, push
  //    devices, notifications, AI memory, reminder dispatches. The
  //    databaseHooks.user.delete.after hook fires: avatar is removed from
  //    Supabase Storage and the account-deleted email is sent.
  await auth.api.deleteUser({
    headers: await headers(),
    body: { userId },
  });

  console.info(
    JSON.stringify({
      event: "account.erasure_completed",
      entityType: "user",
      entityId: userId,
      timestamp: new Date().toISOString(),
    }),
  );

  return { deleted: true };
}
