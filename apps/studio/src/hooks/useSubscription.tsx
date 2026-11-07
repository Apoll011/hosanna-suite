/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { authClient } from "../lib/authClient";
import {
  currentSubscriptionStatus,
  fetchSubscriptionRows,
  findActiveSubscription,
  type Subscription,
} from "../lib/subscriptions";

export type { Subscription } from "../lib/subscriptions";
export { PLAN_PRICING } from "../lib/subscriptions";

export type SubscriptionAction = "checkout" | "portal" | "restore";

/** Stripe Checkout locale codes we can drive from the UI language. */
export type StripeCheckoutLocale = "pt" | "en" | "es";

export interface StartCheckoutOptions {
  /** Bill annually instead of monthly (whatever the server plan defines). */
  annual?: boolean;
  /** Stripe Checkout UI language, e.g. "pt". Falls back to the browser's locale. */
  locale?: StripeCheckoutLocale;
  successUrl?: string;
  cancelUrl?: string;
}

export interface OpenBillingPortalOptions {
  returnUrl?: string;
}

export interface SubscriptionApi {
  /**
   * All subscription rows for the active organization (any status, including
   * history: trialing, active, past_due, canceled, unpaid, ...).
   * `null` while the org has no data yet / on first load.
   */
  subscriptions: Subscription[] | null;
  /** True while the fetch for the current org is in flight (initial load). */
  isLoading: boolean;
  /** Last fetch error message, or `null`. */
  error: string | null;

  /**
   * Whether the organization has ever started a subscription or trial
   * (any subscription row exists). `false` means a brand-new org that has
   * not accepted a trial yet; `null` means unknown (no org / not loaded).
   */
  hasStarted: boolean | null;
  /** The live subscription (status "active" or "trialing"), if any. */
  activeSubscription: Subscription | null;
  /** Status of the live subscription, or `null` when none is in effect. */
  currentStatus: string | null;
  /** True when the live subscription is still in its free trial. */
  isTrialing: boolean;
  /** End of the free trial on the active subscription, if trialing. */
  trialEndsAt: Date | null;

  /** The action currently running, to drive button spinners. */
  pendingAction: SubscriptionAction | null;

  /** Re-fetch subscription rows from the server. */
  refresh: () => Promise<void>;
  /** Open Stripe Checkout to start the trial / subscribe. */
  startCheckout: (
    options?: StartCheckoutOptions,
  ) => Promise<{ error?: string }>;
  /** Open the Stripe billing portal (payment method, invoices, cancel). */
  openBillingPortal: (
    options?: OpenBillingPortalOptions,
  ) => Promise<{ error?: string }>;
  /** Restore / re-activate a subscription that was set to cancel. */
  restore: () => Promise<{ error?: string }>;
}

/**
 * Single source of truth for reading and managing the active organization's
 * subscription: whether a trial/subscription was ever started, what the
 * current subscription status is, and the actions to start / manage it.
 *
 * Note: the "can this user enter the studio" gate intentionally lives in
 * `AuthContext` (`hasAcceptedTrial`), because the route guard needs that bit
 * atomically with the organization during a session refresh. This hook
 * reuses the same underlying API helper (`fetchSubscriptionRows`) so there is
 * a single source of truth for the request shape.
 */
export function useSubscription(): SubscriptionApi {
  const { organization } = useAuth();
  const orgId = organization?.id ?? null;

  const [subscriptions, setSubscriptions] = useState<Subscription[] | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<SubscriptionAction | null>(
    null,
  );

  // Guards against out-of-order responses when the org changes mid-flight.
  const requestSeq = useRef(0);

  const refresh = useCallback(async () => {
    const seq = ++requestSeq.current;
    if (!orgId) {
      setSubscriptions(null);
      setError(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const rows = await fetchSubscriptionRows(orgId);
      if (seq !== requestSeq.current) return; // stale response
      setSubscriptions(rows);
    } catch (err) {
      if (seq !== requestSeq.current) return;
      setError((err as Error)?.message || "Failed to load subscriptions.");
      // Keep the previously loaded rows on refresh failures.
    } finally {
      if (seq === requestSeq.current) setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const hasStarted = useMemo(() => {
    if (subscriptions === null) return null;
    return subscriptions.length > 0;
  }, [subscriptions]);

  const activeSubscription = useMemo(
    () => (subscriptions ? findActiveSubscription(subscriptions) : null),
    [subscriptions],
  );

  const currentStatus = useMemo(
    () => (subscriptions ? currentSubscriptionStatus(subscriptions) : null),
    [subscriptions],
  );

  const isTrialing = activeSubscription?.status === "trialing";

  const trialEndsAt = useMemo(() => {
    const end = activeSubscription?.trialEnd;
    return end ? new Date(end) : null;
  }, [activeSubscription]);

  const startCheckout = useCallback(
    async (options: StartCheckoutOptions = {}) => {
      if (!orgId) return { error: "No active organization." };
      const slug = organization?.slug ?? "";
      const { annual = false, successUrl, cancelUrl, locale } = options;
      setPendingAction("checkout");
      try {
        const { error: apiError } = await authClient.subscription.upgrade({
          plan: "cloud",
          referenceId: orgId,
          customerType: "organization",
          annual,
          locale,
          successUrl:
            successUrl ??
            `${window.location.origin}/${slug}/organization?tab=billing&billing=success`,
          cancelUrl: cancelUrl ?? `${window.location.origin}/${slug}/folders`,
        });
        if (apiError) {
          setPendingAction(null);
          return {
            error: apiError.message || "Couldn't start the checkout.",
          };
        }
        // On success the better-auth client redirects to Stripe Checkout.
        setPendingAction(null);
        return {};
      } catch (err) {
        setPendingAction(null);
        return {
          error: (err as Error)?.message || "Couldn't start the checkout.",
        };
      }
    },
    [orgId, organization?.slug],
  );

  const openBillingPortal = useCallback(
    async (options: OpenBillingPortalOptions = {}) => {
      if (!orgId) return { error: "No active organization." };
      const slug = organization?.slug ?? "";
      setPendingAction("portal");
      try {
        const { error: apiError } = await authClient.subscription.billingPortal(
          {
            referenceId: orgId,
            customerType: "organization",
            returnUrl:
              options.returnUrl ??
              `${window.location.origin}/${slug}/organization?tab=billing`,
          },
        );
        if (apiError) {
          setPendingAction(null);
          return {
            error: apiError.message || "Couldn't open the billing portal.",
          };
        }
        // On success the better-auth client redirects to the portal.
        setPendingAction(null);
        return {};
      } catch (err) {
        setPendingAction(null);
        return {
          error: (err as Error)?.message || "Couldn't open the billing portal.",
        };
      }
    },
    [orgId, organization?.slug],
  );

  const restore = useCallback(async () => {
    if (!orgId) return { error: "No active organization." };
    setPendingAction("restore");
    try {
      const { error: apiError } = await authClient.subscription.restore({
        referenceId: orgId,
        customerType: "organization",
        subscriptionId: activeSubscription?.stripeSubscriptionId || undefined,
      });
      if (apiError) {
        setPendingAction(null);
        return {
          error: apiError.message || "Couldn't restore the subscription.",
        };
      }
      setPendingAction(null);
      await refresh();
      return {};
    } catch (err) {
      setPendingAction(null);
      return {
        error: (err as Error)?.message || "Couldn't restore the subscription.",
      };
    }
  }, [orgId, activeSubscription, refresh]);

  return useMemo<SubscriptionApi>(
    () => ({
      subscriptions,
      isLoading,
      error,
      hasStarted,
      activeSubscription,
      currentStatus,
      isTrialing,
      trialEndsAt,
      pendingAction,
      refresh,
      startCheckout,
      openBillingPortal,
      restore,
    }),
    [
      subscriptions,
      isLoading,
      error,
      hasStarted,
      activeSubscription,
      currentStatus,
      isTrialing,
      trialEndsAt,
      pendingAction,
      refresh,
      startCheckout,
      openBillingPortal,
      restore,
    ],
  );
}
