/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  currentSubscriptionStatus,
  fetchSubscriptionRows,
  findActiveSubscription,
  type Subscription,
} from "../lib/subscriptions";

export type { Subscription } from "../lib/subscriptions";

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

  /** Re-fetch subscription rows from the server. */
  refresh: () => Promise<void>;
}

/**
 * Read-only subscription status for Studio (usage overview, banners).
 * Checkout / portal / restore live on auth-app billing UI.
 */
export function useSubscription(): SubscriptionApi {
  const { organization } = useAuth();
  const orgId = organization?.id ?? null;

  const [subscriptions, setSubscriptions] = useState<Subscription[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      if (seq !== requestSeq.current) return;
      setSubscriptions(rows);
    } catch (err) {
      if (seq !== requestSeq.current) return;
      setError((err as Error)?.message || "Failed to load subscriptions.");
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
      refresh,
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
      refresh,
    ],
  );
}
