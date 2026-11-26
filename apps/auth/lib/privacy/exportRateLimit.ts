// SPDX-License-Identifier: AGPL-3.0-only
import {
  createScopedCache,
  createSecondaryStorage,
  userCacheKey,
  type ScopedCacheKey,
} from "@hosanna/cache";
import { AuthHttpError } from "@/lib/notifications/session";

const WINDOW_SECONDS = 60;
const MAX_EXPORTS_PER_WINDOW = 3;
const distributedStorage = createSecondaryStorage({ namespace: "data-export" });
const localStorage = createScopedCache({
  namespace: "data-export",
  ttlMs: WINDOW_SECONDS * 1000,
});

export async function requireExportRateLimit(userId: string, kind: string): Promise<void> {
  const key = userCacheKey(userId, kind);
  const count = distributedStorage
    ? await distributedStorage.increment(key, WINDOW_SECONDS)
    : await incrementLocalCount(key);

  if (count > MAX_EXPORTS_PER_WINDOW) {
    throw new AuthHttpError(429, "Too many data exports. Try again in one minute.", "RATE_LIMITED");
  }
}

async function incrementLocalCount(key: ScopedCacheKey): Promise<number> {
  const count = (await localStorage.get<number>(key)) ?? 0;
  const nextCount = count + 1;
  await localStorage.set(key, nextCount);
  return nextCount;
}
