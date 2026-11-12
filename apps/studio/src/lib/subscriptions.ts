/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { authClient } from "./authClient";

/**
 * A subscription row stored by the Better Auth Stripe plugin. One row exists
 * per subscription the organization has ever had (including past ones that are
 * now canceled / expired) — so the mere presence of a row means the trial or a
 * paid plan was accepted at some point.
 */
export interface Subscription {
  id: string;
  plan: string;
  status: string;
  referenceId: string;
  stripeSubscriptionId?: string | null;
  periodStart?: string | Date | null;
  periodEnd?: string | Date | null;
  cancelAtPeriodEnd?: boolean | null;
  trialStart?: string | Date | null;
  trialEnd?: string | Date | null;
  billingInterval?: string | null;
}

export const SUBSCRIPTION_CUSTOMER_TYPE = "organization" as const;

/**
 * Fetch every subscription row for an organization, any status.
 * Throws on error so callers decide how to fail.
 */
export async function fetchSubscriptionRows(referenceId: string): Promise<Subscription[]> {
  const { data, error } = await authClient.subscription.list({
    query: {
      referenceId,
      customerType: SUBSCRIPTION_CUSTOMER_TYPE,
    },
  });
  if (error) {
    throw new Error(error.message || "Failed to load subscriptions.");
  }
  return (data as Subscription[]) || [];
}

/** The subscription currently in effect, if any (status "active" or "trialing"). */
export function findActiveSubscription(rows: Subscription[]): Subscription | null {
  return rows.find((s) => s.status === "active" || s.status === "trialing") ?? null;
}

/**
 * Status of the subscription currently in effect ("active" / "trialing"), or
 * `null` when the org has no live subscription. For the full history (canceled,
 * past_due, unpaid, ...) inspect the rows themselves.
 */
export function currentSubscriptionStatus(rows: Subscription[]): Subscription["status"] | null {
  return findActiveSubscription(rows)?.status ?? null;
}
