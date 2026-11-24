/**
 * @license
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const RESUME_REFETCH_DEDUPE_MS = 1000;

export function createResumeRefetchGate(
  windowMs = RESUME_REFETCH_DEDUPE_MS,
): (now?: number) => boolean {
  let lastRefetchAt = Number.NEGATIVE_INFINITY;
  return (now = Date.now()) => {
    if (now - lastRefetchAt < windowMs) return false;
    lastRefetchAt = now;
    return true;
  };
}
