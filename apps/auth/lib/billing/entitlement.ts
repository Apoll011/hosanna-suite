// SPDX-License-Identifier: AGPL-3.0-only
import { createScopedCache, orgCacheKey } from "@hosanna/cache";
import { prisma } from "@/lib/db/prisma";

const SUB_CACHE_TTL_MS = 400_000;
const subCache = createScopedCache({ namespace: "sub:entitled", ttlMs: SUB_CACHE_TTL_MS });

export function isEntitledSubscription(sub: { status: string; trialEnd?: Date | null }): boolean {
  if (sub.status === "active") return true;
  if (sub.status !== "trialing") return false;
  return !sub.trialEnd || sub.trialEnd.getTime() > Date.now();
}

export async function hasActiveSubscription(organizationId: string): Promise<boolean> {
  const key = orgCacheKey(organizationId, "entitled");
  const cached = await subCache.get<boolean>(key);
  if (typeof cached === "boolean") return cached;

  const subscriptions = await prisma.subscription.findMany({
    where: { referenceId: organizationId },
    select: { status: true, trialEnd: true },
  });
  const result = subscriptions.some(isEntitledSubscription);
  await subCache.set(key, result);
  return result;
}
