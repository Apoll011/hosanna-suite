import { createCache } from "@hosanna/cache";
import type { NextFunction, Request, Response } from "express";
import { prisma } from "../database/prisma.js";
import { DEFAULT_LOCALE, t } from "../lib/i18n.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/errors.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const SUB_CACHE_TTL_MS = 400_000;
const subCache = createCache({ namespace: "sub:entitled", ttlMs: SUB_CACHE_TTL_MS });

export function isEntitledSubscription(sub: { status: string; trialEnd?: Date | null }): boolean {
  if (sub.status === "active") return true;
  if (sub.status !== "trialing") return false;
  return !sub.trialEnd || sub.trialEnd.getTime() > Date.now();
}

export async function hasActiveSubscription(organizationId: string): Promise<boolean> {
  const cached = await subCache.get<boolean>(organizationId);
  if (typeof cached === "boolean") return cached;

  const subscriptions = await prisma.subscription.findMany({
    where: { referenceId: organizationId },
    select: { status: true, trialEnd: true },
  });
  const result = subscriptions.some(isEntitledSubscription);
  await subCache.set(organizationId, result);
  return result;
}

export const requireSubscription = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    if (SAFE_METHODS.has(req.method)) return next();

    const locale = req.locale ?? DEFAULT_LOCALE;

    if (!req.orgId) {
      throw AppError.forbidden(t(locale, "error.workspace_required"));
    }

    if (await hasActiveSubscription(req.orgId)) return next();

    throw AppError.subscriptionRequired(t(locale, "error.subscription_required"));
  },
);
