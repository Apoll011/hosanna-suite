// SPDX-License-Identifier: AGPL-3.0-only
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";
import { sendErasureOtp } from "@/lib/erasure/otp";
import { AuthHttpError, jsonError, requireAuthSession } from "@/lib/notifications/session";

const schema = z.object({
  kind: z.enum(["account", "organization"]),
});

export async function POST(req: Request) {
  try {
    const ctx = await requireAuthSession();
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw new AuthHttpError(400, "kind must be 'account' or 'organization'.");
    }

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.email) {
      throw new AuthHttpError(401, "Unauthenticated");
    }

    if (parsed.data.kind === "organization") {
      if (!ctx.organizationId) {
        throw new AuthHttpError(400, "No active organization.");
      }
      if (ctx.role !== "owner") {
        throw new AuthHttpError(403, "Only an organization owner can delete the organization.");
      }

      const org = await prisma.organization.findUnique({
        where: { id: ctx.organizationId },
        select: { name: true },
      });

      await sendErasureOtp({
        kind: "organization",
        userId: ctx.userId,
        email: session.user.email,
        name: session.user.name,
        orgId: ctx.organizationId,
        orgName: org?.name ?? "",
      });
    } else {
      await sendErasureOtp({
        kind: "account",
        userId: ctx.userId,
        email: session.user.email,
        name: session.user.name,
      });
    }

    return NextResponse.json({ sent: true });
  } catch (err) {
    return jsonError(err);
  }
}
