/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PlanPeriodId } from "@hosanna/i18n";
import { getAuthAppUrl } from "./authUrl";
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

/**
 * Fallback display prices — amounts from auth Global Config; `period` is a
 * stable id (`month` | `year`) localized via `billing.period.*` / `billingPeriodLabel`.
 */
export const PLAN_PRICING = {
  monthly: { amount: "€12", period: "month" as PlanPeriodId },
  annual: { amount: "€120", period: "year" as PlanPeriodId },
} as const;

export type PlanPricing = {
  monthly: { amount: string; period: PlanPeriodId };
  annual: { amount: string; period: PlanPeriodId };
};

let cachedPricing: PlanPricing | null = null;

function asPeriodId(value: unknown, fallback: PlanPeriodId): PlanPeriodId {
  return value === "year" || value === "month" ? value : fallback;
}

/** Load display amounts from GET {auth}/api/billing/pricing (public). */
export async function fetchPlanPricing(authBaseUrl?: string): Promise<PlanPricing> {
  if (cachedPricing) return cachedPricing;
  const base = authBaseUrl ?? `${getAuthAppUrl().replace(/\/$/, "")}/api`;
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/billing/pricing`, {
      credentials: "omit",
    });
    if (!res.ok) return PLAN_PRICING;
    const data = await res.json();
    cachedPricing = {
      monthly: {
        amount: data.monthly?.amount ?? PLAN_PRICING.monthly.amount,
        period: asPeriodId(data.monthly?.period, "month"),
      },
      annual: {
        amount: data.annual?.amount ?? PLAN_PRICING.annual.amount,
        period: asPeriodId(data.annual?.period, "year"),
      },
    };
    return cachedPricing;
  } catch {
    return PLAN_PRICING;
  }
}
