// SPDX-License-Identifier: AGPL-3.0-only
import { withAuthCors } from "@hosanna/auth/server";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { AuthHttpError, jsonError, requireAuthSession } from "@/lib/notifications/session";

const CURRENT_DPA_VERSION = "1.0";

const acceptSchema = z.object({
  agreementType: z.literal("dpa").default("dpa"),
  version: z.string().default(CURRENT_DPA_VERSION),
});

async function getAgreement() {
  try {
    const ctx = await requireAuthSession();
    if (!ctx.organizationId) {
      throw new AuthHttpError(403, "An active organization is required.");
    }

    const agreement = await prisma.organizationAgreement.findFirst({
      where: {
        organizationId: ctx.organizationId,
        agreementType: "dpa",
      },
      orderBy: { acceptedAt: "desc" },
      include: {
        acceptedByUser: { select: { id: true, name: true, email: true } },
        organization: { select: { id: true, name: true } },
      },
    });

    return Response.json({
      accepted: !!agreement,
      currentVersion: CURRENT_DPA_VERSION,
      agreement: agreement
        ? {
            id: agreement.id,
            agreementType: agreement.agreementType,
            version: agreement.version,
            acceptedAt: agreement.acceptedAt,
            organization: agreement.organization,
            acceptedByUser: agreement.acceptedByUser,
          }
        : null,
    });
  } catch (err) {
    return jsonError(err);
  }
}

async function acceptAgreement(req: Request) {
  try {
    const ctx = await requireAuthSession();
    if (!ctx.organizationId || !ctx.role) {
      throw new AuthHttpError(403, "An active organization is required.");
    }

    if (ctx.role !== "owner" && ctx.role !== "admin") {
      throw new AuthHttpError(403, "Only organization owners or administrators can accept legal agreements.");
    }

    let bodyData = {};
    try {
      bodyData = await req.json();
    } catch {
      // Empty body is allowed, defaults will apply
    }

    const parsed = acceptSchema.safeParse(bodyData);
    if (!parsed.success) {
      throw new AuthHttpError(400, "Invalid agreement payload.");
    }

    const reqHeaders = await headers();
    const forwarded = reqHeaders.get("x-forwarded-for");
    const ipAddress = forwarded ? forwarded.split(",")[0]?.trim() : reqHeaders.get("x-real-ip");
    const userAgent = reqHeaders.get("user-agent");

    const agreement = await prisma.organizationAgreement.upsert({
      where: {
        organizationId_agreementType_version: {
          organizationId: ctx.organizationId,
          agreementType: parsed.data.agreementType,
          version: parsed.data.version,
        },
      },
      update: {
        acceptedByUserId: ctx.userId,
        acceptedAt: new Date(),
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      },
      create: {
        organizationId: ctx.organizationId,
        agreementType: parsed.data.agreementType,
        version: parsed.data.version,
        acceptedByUserId: ctx.userId,
        acceptedAt: new Date(),
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      },
      include: {
        acceptedByUser: { select: { id: true, name: true, email: true } },
        organization: { select: { id: true, name: true } },
      },
    });

    return Response.json({
      success: true,
      agreement: {
        id: agreement.id,
        agreementType: agreement.agreementType,
        version: agreement.version,
        acceptedAt: agreement.acceptedAt,
        organization: agreement.organization,
        acceptedByUser: agreement.acceptedByUser,
      },
    });
  } catch (err) {
    return jsonError(err);
  }
}

export const GET = withAuthCors(getAgreement);
export const POST = withAuthCors(acceptAgreement);
