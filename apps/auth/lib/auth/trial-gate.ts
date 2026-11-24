// SPDX-License-Identifier: AGPL-3.0-only
export type OrgTrialGate = "subscribed" | "trialAvailable" | "ownerRequired";

/**
 * Mirrors Studio's gate (any subscription row lets the org in) and the Stripe
 * plugin's `authorizeReference`, which only lets owners start checkout.
 * An unknown role still offers the trial; the server rejects non-owners.
 */
export function resolveOrgTrialGate(
  subscriptionCount: number,
  memberRole: string | null,
): OrgTrialGate {
  if (subscriptionCount > 0) return "subscribed";
  if (memberRole === null || memberRole === "owner") return "trialAvailable";
  return "ownerRequired";
}
