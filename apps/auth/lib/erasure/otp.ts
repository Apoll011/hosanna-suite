// SPDX-License-Identifier: AGPL-3.0-only
import { createHash, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { sendDeletionOtpEmail, sendOrgDeletionOtpEmail } from "@/lib/services/email";

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_EXPIRY_MINUTES = 10;

export type ErasureOtpKind = "account" | "organization";

function otpIdentifier(kind: ErasureOtpKind, userId: string, orgId?: string): string {
  return kind === "account" ? `erasure:account:${userId}` : `erasure:org:${orgId ?? ""}:${userId}`;
}

function hashOtp(otp: string): string {
  return createHash("sha256").update(otp).digest("hex");
}

export async function sendErasureOtp(params: {
  kind: ErasureOtpKind;
  userId: string;
  email: string;
  name?: string | null;
  orgId?: string;
  orgName?: string;
  locale?: string;
  db?: typeof prisma;
  sendEmail?: (code: string) => Promise<void>;
}): Promise<void> {
  const db = params.db ?? prisma;
  const code = String(randomInt(100000, 999999));
  const identifier = otpIdentifier(params.kind, params.userId, params.orgId);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await db.verification.deleteMany({ where: { identifier } });
  await db.verification.create({
    data: {
      id: randomUUID(),
      identifier,
      value: hashOtp(code),
      expiresAt,
    },
  });

  if (params.sendEmail) {
    await params.sendEmail(code);
  } else if (params.kind === "account") {
    await sendDeletionOtpEmail(params.email, {
      otp: code,
      expireMinutes: OTP_EXPIRY_MINUTES,
      first_name: params.name ?? undefined,
      locale: params.locale,
    });
  } else {
    await sendOrgDeletionOtpEmail(params.email, {
      otp: code,
      church_name: params.orgName ?? "",
      expireMinutes: OTP_EXPIRY_MINUTES,
      first_name: params.name ?? undefined,
      locale: params.locale,
    });
  }
}

export async function verifyErasureOtp(params: {
  kind: ErasureOtpKind;
  userId: string;
  orgId?: string;
  otp: string;
  db?: typeof prisma;
}): Promise<boolean> {
  const db = params.db ?? prisma;
  const identifier = otpIdentifier(params.kind, params.userId, params.orgId);
  const row = await db.verification.findFirst({
    where: { identifier },
    orderBy: { createdAt: "desc" },
  });

  if (!row || row.expiresAt.getTime() < Date.now()) {
    if (row) {
      await db.verification.delete({ where: { id: row.id } }).catch(() => {});
    }
    return false;
  }

  const candidate = Buffer.from(hashOtp(params.otp.trim()), "hex");
  const expected = Buffer.from(row.value, "hex");
  if (candidate.length !== expected.length || !timingSafeEqual(candidate, expected)) {
    return false;
  }

  await db.verification.deleteMany({ where: { identifier } });
  return true;
}
