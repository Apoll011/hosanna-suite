// SPDX-License-Identifier: AGPL-3.0-only
import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthHttpError, jsonError, requireAuthSession } from "@/lib/notifications/session";
import { eraseAccount } from "@/lib/erasure/account";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";

const schema = z.object({
  otp: z.string().min(4),
});

export async function POST(req: Request) {
  try {
    const ctx = await requireAuthSession();

    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw new AuthHttpError(400, "otp is required.");
    }

    const session = (await auth.api.getSession({ headers: await headers() }))!;

    // Verify the deletion OTP.
    const otpResult = await auth.api.verifyEmailOTP({
      headers: await headers(),
      body: {
        email: session.user.email,
        otp: parsed.data.otp,
        type: "delete-account" as any,
      },
    });
    if (!otpResult || (otpResult as any).error) {
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
