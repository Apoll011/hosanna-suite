// SPDX-License-Identifier: AGPL-3.0-only
import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthHttpError, jsonError, requireAuthSession } from "@/lib/notifications/session";
import { eraseOrganization } from "@/lib/erasure/organization";
import { stripeClient } from "@/lib/auth/server";
import { sendOrgDeletedEmail } from "@/lib/services/email";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";

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

    // Verify the deletion OTP.
    const otpResult = await auth.api.verifyEmailOTP({
      headers: await headers(),
      body: {
        email: (await auth.api.getSession({ headers: await headers() }))!.user.email,
        otp: parsed.data.otp,
        type: "delete-organization" as any,
      },
    });
    if (!otpResult || (otpResult as any).error) {
      throw new AuthHttpError(401, "Invalid or expired verification code.");
    }

    // Fetch org name before deletion for the confirmation email.
    const org = await prisma.organization.findUnique({
      where: { id: ctx.organizationId },
      select: { name: true },
    });

    const user = (await auth.api.getSession({ headers: await headers() }))!.user;

    const result = await eraseOrganization(ctx.organizationId, stripeClient);

    // Send confirmation email to the owner.
    try {
      await sendOrgDeletedEmail(user.email, {
        first_name: user.name,
        church_name: org?.name ?? "",
      });
    } catch (err) {
      console.error("[erasure] org deleted email failed:", err);
    }

    return NextResponse.json(result);
  } catch (err) {
    return jsonError(err);
  }
}
