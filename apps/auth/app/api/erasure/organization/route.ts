// SPDX-License-Identifier: AGPL-3.0-only
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth, stripeClient } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";
import { eraseOrganization } from "@/lib/erasure/organization";
import { verifyErasureOtp } from "@/lib/erasure/otp";
import { AuthHttpError, jsonError, requireAuthSession } from "@/lib/notifications/session";
import { sendOrgDeletedEmail } from "@/lib/services/email";

const schema = z.object({
  otp: z.string().min(4),
  exportConfirmed: z.literal(true),
});

export async function POST(req: Request) {
  try {
    const ctx = await requireAuthSession();

    if (!ctx.organizationId) {
      throw new AuthHttpError(400, "No active organization.");
    }
    if (ctx.role !== "owner") {
      throw new AuthHttpError(403, "Only an organization owner can delete the organization.");
    }

    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw new AuthHttpError(400, "otp and exportConfirmed are required.");
    }

    const validOtp = await verifyErasureOtp({
      kind: "organization",
      userId: ctx.userId,
      orgId: ctx.organizationId,
      otp: parsed.data.otp,
    });
    if (!validOtp) {
      throw new AuthHttpError(401, "Invalid or expired verification code.");
    }

    const org = await prisma.organization.findUnique({
      where: { id: ctx.organizationId },
      select: { name: true },
    });
    const session = await auth.api.getSession({ headers: await headers() });

    const result = await eraseOrganization(ctx.organizationId, stripeClient);

    if (session?.user?.email) {
      try {
        await sendOrgDeletedEmail(session.user.email, {
          first_name: session.user.name,
          church_name: org?.name ?? "",
        });
      } catch (err) {
        console.error("[erasure] org deleted email failed:", err);
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    return jsonError(err);
  }
}
