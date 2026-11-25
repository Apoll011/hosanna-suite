// SPDX-License-Identifier: AGPL-3.0-only
import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";
import { sendAccountDeletedEmail } from "@/lib/services/email";
import { authImages } from "@/lib/storage/auth-images";

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

export interface AccountErasureDeps {
  db?: typeof prisma;
  revokeSessions?: (userId: string) => Promise<void>;
  deleteAvatar?: (userId: string) => Promise<void>;
  sendDeletedEmail?: (email: string, name: string) => Promise<unknown>;
}

export async function findSoleOwnerOrgs(
  userId: string,
  db: typeof prisma = prisma,
): Promise<SoleOwnerOrg[]> {
  const ownerships = await db.member.findMany({
    where: { userId, role: "owner" },
    select: { organizationId: true },
  });

  const soleOwnerOrgs: SoleOwnerOrg[] = [];

  for (const { organizationId } of ownerships) {
    const ownerCount = await db.member.count({
      where: { organizationId, role: "owner" },
    });
    if (ownerCount === 1) {
      const org = await db.organization.findUnique({
        where: { id: organizationId },
        select: { id: true, name: true, slug: true },
      });
      if (org) soleOwnerOrgs.push(org);
    }
  }

  return soleOwnerOrgs;
}

export async function eraseAccount(
  userId: string,
  deps: AccountErasureDeps = {},
): Promise<AccountErasureOutcome> {
  const db = deps.db ?? prisma;
  const revokeSessions =
    deps.revokeSessions ??
    (async (id: string) => {
      await auth.api.revokeUserSessions({
        headers: await headers(),
        body: { userId: id },
      });
    });
  const deleteAvatar = deps.deleteAvatar ?? ((id: string) => authImages.deleteAvatar(id));
  const sendDeletedEmail =
    deps.sendDeletedEmail ??
    ((email: string, name: string) => sendAccountDeletedEmail(email, { first_name: name }));

  const soleOwnerOrgs = await findSoleOwnerOrgs(userId, db);
  if (soleOwnerOrgs.length > 0) {
    return { blocked: true, reason: "sole_owner", orgs: soleOwnerOrgs };
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  });
  if (!user) throw new Error("User not found");

  try {
    await revokeSessions(userId);
  } catch (err) {
    console.error("[erasure] session revocation failed:", err);
  }

  await db.$transaction(async (tx) => {
    await tx.oauthAccessToken.deleteMany({ where: { userId } });
    await tx.oauthRefreshToken.deleteMany({ where: { userId } });
    await tx.oauthConsent.deleteMany({ where: { userId } });
    await tx.oauthClient.deleteMany({ where: { userId } });
    await tx.verification.deleteMany({
      where: {
        OR: [{ identifier: `erasure:account:${userId}` }, { identifier: user.email }],
      },
    });

    await tx.user.delete({ where: { id: userId } });
  });

  try {
    await deleteAvatar(userId);
  } catch (err) {
    console.error("[erasure] avatar cleanup failed after user deletion:", err);
  }

  try {
    await sendDeletedEmail(user.email, user.name);
  } catch (err) {
    console.error("[erasure] failed to send account deleted email:", err);
  }

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
