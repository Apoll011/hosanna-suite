// SPDX-License-Identifier: AGPL-3.0-only
import { NextResponse } from "next/server";
import { z } from "zod";
import { eraseAccount, findSoleOwnerOrgs } from "@/lib/erasure/account";
import { verifyErasureOtp } from "@/lib/erasure/otp";
import { AuthHttpError, jsonError, requireAuthSession } from "@/lib/notifications/session";

const schema = z.object({
  otp: z.string().min(4),
});

export async function GET() {
  try {
    const ctx = await requireAuthSession();
    const soleOwnerOrgs = await findSoleOwnerOrgs(ctx.userId);
    return NextResponse.json({ soleOwnerOrgs });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requireAuthSession();

    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw new AuthHttpError(400, "otp is required.");
    }

    const validOtp = await verifyErasureOtp({
      kind: "account",
      userId: ctx.userId,
      otp: parsed.data.otp,
    });
    if (!validOtp) {
      throw new AuthHttpError(401, "Invalid or expired verification code.");
    }

    const outcome = await eraseAccount(ctx.userId);

    if ("blocked" in outcome) {
      return NextResponse.json(outcome, { status: 409 });
    }

    return NextResponse.json(outcome);
  } catch (err) {
    return jsonError(err);
  }
}
