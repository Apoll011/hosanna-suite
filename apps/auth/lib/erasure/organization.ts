// SPDX-License-Identifier: AGPL-3.0-only
import Stripe from "stripe";
import { prisma } from "@/lib/db/prisma";
import { authImages } from "@/lib/storage/auth-images";

export interface OrgErasureResult {
  deleted: true;
  stripeNote: string;
}

export interface OrgErasureDeps {
  db?: typeof prisma;
  deleteLogo?: (orgId: string) => Promise<void>;
}

export async function eraseOrganization(
  orgId: string,
  stripeClient: Stripe,
  deps: OrgErasureDeps = {},
): Promise<OrgErasureResult> {
  const db = deps.db ?? prisma;
  const deleteLogo = deps.deleteLogo ?? ((id: string) => authImages.deleteOrganizationLogo(id));

  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: { id: true, logo: true },
  });
  if (!org) throw new Error("Organization not found");

  const subscriptions = await db.subscription.findMany({
    where: { referenceId: orgId },
    select: { id: true, stripeSubscriptionId: true },
  });

  let stripeNote = "No active subscription found.";
  for (const sub of subscriptions) {
    if (sub.stripeSubscriptionId) {
      try {
        await stripeClient.subscriptions.cancel(sub.stripeSubscriptionId);
        stripeNote =
          "Stripe subscription canceled immediately. Customer record retained per Stripe terms.";
      } catch (err) {
        console.error("[erasure] Stripe subscription cancel failed:", err);
        stripeNote = "Stripe subscription cancel attempted; check Stripe dashboard.";
      }
    }
  }

  await db.$transaction(async (tx) => {
    // Retain DPA records without a live organization FK.
    await tx.organizationAgreement.updateMany({
      where: { organizationId: orgId },
      data: { deletedOrgId: orgId, organizationId: null },
    });

    // Clean org-scoped rows that have no Prisma FK relation to Organization.
    await tx.subscription.deleteMany({ where: { referenceId: orgId } });
    await tx.notification.deleteMany({ where: { organizationId: orgId } });
    await tx.oauthAccessToken.deleteMany({ where: { referenceId: orgId } });
    await tx.oauthRefreshToken.deleteMany({ where: { referenceId: orgId } });
    await tx.oauthConsent.deleteMany({ where: { referenceId: orgId } });
    await tx.oauthClient.deleteMany({ where: { referenceId: orgId } });
    await tx.verification.deleteMany({
      where: { identifier: { startsWith: `erasure:org:${orgId}:` } },
    });

    // Cascades wipe folders, collections, songs, services, agendaEvents,
    // serviceNotes, serviceSongAnnotations, aiConfig, aiMemory, teams, members,
    // and invitations.
    await tx.organization.delete({ where: { id: orgId } });
  });

  if (org.logo) {
    try {
      await deleteLogo(orgId);
    } catch (err) {
      console.error("[erasure] org logo delete failed:", err);
    }
  }

  console.info(
    JSON.stringify({
      event: "org.erasure_completed",
      entityType: "organization",
      entityId: orgId,
      timestamp: new Date().toISOString(),
    }),
  );

  return { deleted: true, stripeNote };
}
