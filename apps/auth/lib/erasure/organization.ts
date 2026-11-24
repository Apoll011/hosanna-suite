// SPDX-License-Identifier: AGPL-3.0-only
import Stripe from "stripe";
import { prisma } from "@/lib/db/prisma";
import { authImages } from "@/lib/storage/auth-images";

export interface OrgErasureResult {
  deleted: true;
  stripeNote: string;
}

export async function eraseOrganization(
  orgId: string,
  stripeClient: Stripe,
): Promise<OrgErasureResult> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, logo: true },
  });
  if (!org) throw new Error("Organization not found");

  // 1. Cancel Stripe subscription immediately.
  const subscriptions = await prisma.subscription.findMany({
    where: { referenceId: orgId },
    select: { id: true, stripeSubscriptionId: true, stripeCustomerId: true },
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

  // 2. Detach DPA records before cascade (retain for legal compliance).
  await prisma.organizationAgreement.updateMany({
    where: { organizationId: orgId },
    data: { deletedOrgId: orgId, organizationId: null },
  });

  // 3. Delete Subscription rows explicitly (no FK to organization).
  await prisma.subscription.deleteMany({ where: { referenceId: orgId } });

  // 4. Delete the organization row; cascades wipe all related Postgres data.
  await prisma.organization.delete({ where: { id: orgId } });

  // 5. Delete org logo from Supabase Storage.
  if (org.logo) {
    try {
      await authImages.deleteOrganizationLogo(orgId);
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
