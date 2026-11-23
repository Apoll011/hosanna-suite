/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
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
