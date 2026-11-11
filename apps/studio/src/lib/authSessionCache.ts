/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Studio session SWR keys. Negative states (no org / trial not accepted) drive
 * hard redirects to the auth app — never treat them as ready until network confirms.
 */

export const CACHED_USER_KEY = "cached_auth_user";
export const CACHED_ORG_KEY = "cached_auth_org";
export const CACHED_ORGS_KEY = "cached_auth_orgs";
export const CACHED_TRIAL_KEY = "cached_auth_trial";

type StorageLike = Pick<Storage, "getItem">;

/**
 * True when localStorage has a positive session snapshot that is safe to paint
 * and route on immediately (user + org, and trial not known-false).
 */
export function canTrustCachedSessionForPaint(storage: StorageLike = localStorage): boolean {
  try {
    if (!storage.getItem(CACHED_USER_KEY)) return false;
    if (!storage.getItem(CACHED_ORG_KEY)) return false;
    // Explicit false redirects to onboarding — wait for a network confirmation.
    if (storage.getItem(CACHED_TRIAL_KEY) === "false") return false;
    return true;
  } catch {
    return false;
  }
}

export function readCachedUserId(storage: StorageLike = localStorage): string | null {
  try {
    const raw = storage.getItem(CACHED_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { id?: unknown };
    return typeof parsed?.id === "string" ? parsed.id : null;
  } catch {
    return null;
  }
}
