"use client";

import { AccountCenter } from "@/components/account/AccountCenter";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { authClient } from "@/lib/auth-client";
import { useI18n } from "@/lib/i18n";
import { Badge, Button, PageHeader, Spinner, Surface } from "@hosanna/ui";
import { AlertTriangle, Check, CreditCard, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Subscription = {
  id: string;
  plan: string;
  status: string;
  referenceId: string;
  periodStart?: string | Date | null;
  periodEnd?: string | Date | null;
  cancelAtPeriodEnd?: boolean | null;
  trialStart?: string | Date | null;
  trialEnd?: string | Date | null;
  billingInterval?: string | null;
};

const PLAN_PRICING = {
  monthly: { amount: "€12", period: "/mo" },
  annual: { amount: "€120", period: "/yr" },
} as const;

const PLAN_FEATURE_KEYS = [
  "settings.billing.plan.features.sync",
  "settings.billing.plan.features.unlimited",
  "settings.billing.plan.features.print",
  "settings.billing.plan.features.backups",
  "settings.billing.plan.features.support",
] as const;

function findActive(rows: Subscription[]): Subscription | null {
  return rows.find((s) => s.status === "active" || s.status === "trialing") ?? null;
}

function billingReturnUrl(): string {
  return `${window.location.origin}/account/organization/billing`;
}

function subsCacheKey(orgId: string): string {
  return `hosanna.auth.cached_subs.${orgId}`;
}

function readCachedSubs(orgId: string): Subscription[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(subsCacheKey(orgId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Subscription[]) : null;
  } catch {
    return null;
  }
}

function writeCachedSubs(orgId: string, rows: Subscription[]): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(subsCacheKey(orgId), JSON.stringify(rows));
  } catch {
    /* quota / private mode */
  }
}

export function OrgBillingPage() {
  const { t, language, locale } = useI18n();
  const { organization, capabilities, isLoading: orgLoading } = useActiveOrganization();

  const [subscriptions, setSubscriptions] = useState<Subscription[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"checkout" | "portal" | "restore" | null>(
    null,
  );
  const [annual, setAnnual] = useState(false);
  const [planPricing, setPlanPricing] = useState(PLAN_PRICING);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback((msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("billing") === "success") {
      showToast(t("settings.billing.subscribedToast"), "success");
      params.delete("billing");
      const next = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
      window.history.replaceState({}, "", next);
    }
  }, [t, showToast]);

  const subscriptionsRef = useRef(subscriptions);
  subscriptionsRef.current = subscriptions;

  const refresh = useCallback(async () => {
    if (!organization?.id) {
      setSubscriptions(null);
      setIsLoading(false);
      return;
    }
    const orgId = organization.id;
    const hadRows = subscriptionsRef.current !== null;
    if (!hadRows) setIsLoading(true);
    setFetchError(null);
    try {
      const { data, error } = await authClient.subscription.list({
        query: {
          referenceId: orgId,
          customerType: "organization",
        },
      });
      if (error) throw new Error(error.message || t("settings.billing.loadError"));
      const rows = (data as Subscription[]) || [];
      setSubscriptions(rows);
      writeCachedSubs(orgId, rows);
    } catch (err) {
      setFetchError((err as Error)?.message || t("settings.billing.loadError"));
      if (!hadRows) setSubscriptions(null);
    } finally {
      setIsLoading(false);
    }
  }, [organization?.id, t]);

  useEffect(() => {
    if (!organization?.id) {
      setSubscriptions(null);
      subscriptionsRef.current = null;
      setIsLoading(false);
      return;
    }
    const cached = readCachedSubs(organization.id);
    if (cached) {
      setSubscriptions(cached);
      subscriptionsRef.current = cached;
      setIsLoading(false);
    } else {
      setSubscriptions(null);
      subscriptionsRef.current = null;
      setIsLoading(true);
    }
    void refresh();
  }, [organization?.id, refresh]);

  useEffect(() => {
    const base =
      (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) ||
      "https://api.hosanna.live/api";
    void fetch(`${base.replace(/\/+$/, "")}/billing/pricing`, { credentials: "omit" })
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        setPlanPricing({
          monthly: {
            amount: data.monthly?.amount ?? PLAN_PRICING.monthly.amount,
            period: data.monthly?.period ?? PLAN_PRICING.monthly.period,
          },
          annual: {
            amount: data.annual?.amount ?? PLAN_PRICING.annual.amount,
            period: data.annual?.period ?? PLAN_PRICING.annual.period,
          },
        });
      })
      .catch(() => {
        /* keep defaults */
      });
  }, []);

  const activeSub = useMemo(
    () => (subscriptions ? findActive(subscriptions) : null),
    [subscriptions],
  );

  const usedTrial = (subscriptions ?? []).some(
    (s) => Boolean(s.trialStart) || Boolean(s.trialEnd) || s.status === "trialing",
  );

  const formatDate = (d?: string | Date | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const daysLeft = (end?: string | Date | null) => {
    if (!end) return 0;
    return Math.max(0, Math.ceil((new Date(end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  };

  const handleCheckout = async () => {
    if (!capabilities.canManageBilling || !organization) return;
    setPendingAction("checkout");
    try {
      const origin = window.location.origin;
      const { error } = await authClient.subscription.upgrade({
        plan: "cloud",
        referenceId: organization.id,
        customerType: "organization",
        annual,
        locale: language,
        successUrl: `${origin}/account/organization/billing?billing=success`,
        cancelUrl: `${origin}/account/organization/billing`,
      });
      if (error) {
        showToast(error.message || t("settings.billing.checkoutError"), "error");
        setPendingAction(null);
      }
    } catch (err) {
      showToast((err as Error)?.message || t("settings.billing.checkoutError"), "error");
      setPendingAction(null);
    }
  };

  const handlePortal = async () => {
    if (!capabilities.canManageBilling || !organization) return;
    setPendingAction("portal");
    try {
      const { error } = await authClient.subscription.billingPortal({
        referenceId: organization.id,
        customerType: "organization",
        returnUrl: billingReturnUrl(),
      });
      if (error) {
        showToast(error.message || t("settings.billing.portalError"), "error");
      }
    } catch (err) {
      showToast((err as Error)?.message || t("settings.billing.portalError"), "error");
    } finally {
      setPendingAction(null);
    }
  };

  const handleRestore = async () => {
    if (!capabilities.canManageBilling || !organization) return;
    setPendingAction("restore");
    try {
      const { error } = await authClient.subscription.restore({
        referenceId: organization.id,
        customerType: "organization",
      });
      if (error) {
        showToast(error.message || t("settings.billing.restoreError"), "error");
      } else {
        showToast(t("settings.billing.restoreSuccess"), "success");
        await refresh();
      }
    } catch (err) {
      showToast((err as Error)?.message || t("settings.billing.restoreError"), "error");
    } finally {
      setPendingAction(null);
    }
  };

  if (orgLoading && !organization) {
    return (
      <AccountCenter>
        <div className="flex justify-center py-16">
          <Spinner size="md" label={t("common.loading")} />
        </div>
      </AccountCenter>
    );
  }

  if (!organization) {
    return (
      <AccountCenter>
        <Surface>
          <p className="text-sm text-m3-secondary">{t("org.noOrganization")}</p>
        </Surface>
      </AccountCenter>
    );
  }

  if (!capabilities.canAccessBilling) {
    return (
      <AccountCenter toast={toast}>
        <div className="space-y-6">
          <PageHeader title={t("settings.billing.title")} description={t("settings.billing.desc")} />
          <Surface className="text-center py-8">
            <h3 className="text-base font-semibold text-m3-text">
              {t("settings.billing.noAccessTitle")}
            </h3>
            <p className="text-sm text-m3-secondary mt-1">{t("settings.billing.noAccessDesc")}</p>
          </Surface>
        </div>
      </AccountCenter>
    );
  }

  const loadingInitial = isLoading && subscriptions === null;
  const refreshing = isLoading && subscriptions !== null;

  return (
    <AccountCenter toast={toast}>
      <div className="space-y-5">
        <PageHeader title={t("settings.billing.title")} description={t("settings.billing.desc")} />

        {!capabilities.canManageBilling ? (
          <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
            {t("settings.billing.readOnly")}
          </p>
        ) : null}

        {loadingInitial ? (
          <div className="flex justify-center py-12">
            <Spinner label={t("settings.billing.loading")} />
          </div>
        ) : fetchError && subscriptions === null ? (
          <Surface>
            <div className="flex flex-col items-center text-center gap-3 py-6">
              <AlertTriangle className="w-6 h-6 text-m3-danger" />
              <p className="text-sm text-m3-danger">{fetchError}</p>
              <Button variant="outline" size="sm" onClick={() => void refresh()}>
                {t("common.retry")}
              </Button>
            </div>
          </Surface>
        ) : activeSub ? (
          <div className="space-y-4">
            {refreshing ? (
              <p className="text-xs text-m3-secondary">{t("settings.billing.loading")}</p>
            ) : null}

            {activeSub.status === "trialing" && activeSub.trialEnd ? (
              <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
                <strong className="font-semibold">
                  {t("settings.billing.trialDaysLeft", {
                    days: daysLeft(activeSub.trialEnd),
                  })}
                </strong>
                <p className="mt-0.5 opacity-90">
                  {t("settings.billing.trialEndsOn", {
                    date: formatDate(activeSub.trialEnd),
                  })}
                </p>
              </div>
            ) : null}

            {activeSub.cancelAtPeriodEnd ? (
              <div className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-sm text-rose-700 dark:text-rose-400">
                  <strong className="font-semibold">{t("settings.billing.cancelingTitle")}</strong>
                  <p className="mt-0.5 opacity-90">
                    {t("settings.billing.cancelingDesc", {
                      date: formatDate(activeSub.periodEnd),
                    })}
                  </p>
                </div>
                {capabilities.canManageBilling ? (
                  <Button
                    variant="outline"
                    size="sm"
                    isLoading={pendingAction === "restore"}
                    onClick={() => void handleRestore()}
                    icon={<RotateCcw className="w-3.5 h-3.5" />}
                  >
                    {t("settings.billing.restore")}
                  </Button>
                ) : null}
              </div>
            ) : null}

            <Surface className="space-y-5">
              <div className="flex flex-wrap items-center gap-2.5">
                <Badge variant={activeSub.status === "trialing" ? "warning" : "success"} size="md">
                  {activeSub.status === "trialing"
                    ? t("settings.billing.status.trialing")
                    : t("settings.billing.status.active")}
                </Badge>
                <div className="min-w-0">
                  <p className="text-xs text-m3-secondary">{t("settings.billing.currentPlanTitle")}</p>
                  <h3 className="text-base font-semibold text-m3-text">
                    {t("settings.billing.planName")}
                    {activeSub.billingInterval ? (
                      <span className="text-sm font-normal text-m3-secondary">
                        {" "}
                        ·{" "}
                        {activeSub.billingInterval === "year"
                          ? t("settings.billing.annual")
                          : t("settings.billing.monthly")}
                      </span>
                    ) : null}
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-m3-sidebar/50 px-3.5 py-3">
                  <span className="block text-label text-m3-secondary">
                    {t("settings.billing.currentPeriod")}
                  </span>
                  <span className="font-semibold text-m3-text">
                    {formatDate(activeSub.periodStart)} → {formatDate(activeSub.periodEnd)}
                  </span>
                </div>
                <div className="rounded-lg bg-m3-sidebar/50 px-3.5 py-3">
                  <span className="block text-label text-m3-secondary">
                    {t("settings.billing.nextCharge")}
                  </span>
                  <span className="font-semibold text-m3-text">
                    {activeSub.cancelAtPeriodEnd ? "—" : formatDate(activeSub.periodEnd)}
                  </span>
                </div>
              </div>

              {capabilities.canManageBilling ? (
                <div>
                  <Button
                    variant="primary"
                    isLoading={pendingAction === "portal"}
                    icon={<CreditCard className="w-4 h-4" />}
                    onClick={() => void handlePortal()}
                  >
                    {t("settings.billing.manage")}
                  </Button>
                  <p className="text-xs text-m3-secondary mt-2">{t("settings.billing.manageDesc")}</p>
                </div>
              ) : null}
            </Surface>
          </div>
        ) : (
          <div className="space-y-4">
            {refreshing ? (
              <p className="text-xs text-m3-secondary">{t("settings.billing.loading")}</p>
            ) : null}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
              <Surface className="space-y-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-m3-text">
                      {t("settings.billing.planName")}
                    </h3>
                    <p className="text-sm text-m3-secondary mt-1">
                      {t("settings.billing.planDesc")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 border border-m3-border rounded-full p-1 bg-m3-sidebar/40 shrink-0">
                    <button
                      type="button"
                      onClick={() => setAnnual(false)}
                      disabled={pendingAction === "checkout"}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer disabled:opacity-50 ${
                        !annual ? "bg-m3-primary text-white" : "text-m3-secondary"
                      }`}
                    >
                      {t("settings.billing.monthly")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnnual(true)}
                      disabled={pendingAction === "checkout"}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer disabled:opacity-50 ${
                        annual ? "bg-m3-primary text-white" : "text-m3-secondary"
                      }`}
                    >
                      {t("settings.billing.annual")}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-semibold text-m3-text">
                      {annual ? planPricing.annual.amount : planPricing.monthly.amount}
                    </span>
                    <span className="text-sm text-m3-secondary">
                      {annual ? planPricing.annual.period : planPricing.monthly.period}
                    </span>
                  </div>
                  {annual ? (
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1.5">
                      <Check className="w-3.5 h-3.5" />
                      {t("settings.billing.annualSavings")}
                    </p>
                  ) : null}
                </div>

                {capabilities.canManageBilling ? (
                  <div>
                    <Button
                      variant="primary"
                      isLoading={pendingAction === "checkout"}
                      onClick={() => void handleCheckout()}
                    >
                      {usedTrial ? t("settings.billing.subscribe") : t("settings.billing.startTrial")}
                    </Button>
                    <p className="text-xs text-m3-secondary mt-2">
                      {usedTrial
                        ? t("settings.billing.subscribeNote")
                        : t("settings.billing.trialNote")}
                    </p>
                    <p className="text-xs text-m3-secondary mt-1">{t("settings.billing.promoHint")}</p>
                  </div>
                ) : (
                  <p className="text-xs text-m3-secondary">{t("settings.billing.askOwner")}</p>
                )}
              </Surface>

              <Surface className="space-y-4">
                <h3 className="text-sm font-semibold text-m3-text">
                  {t("settings.billing.includedTitle")}
                </h3>
                <ul className="space-y-2.5">
                  {PLAN_FEATURE_KEYS.map((key) => (
                    <li key={key} className="flex items-center gap-2.5 text-sm text-m3-text">
                      <Check className="w-4 h-4 text-m3-primary shrink-0" />
                      {t(key)}
                    </li>
                  ))}
                </ul>
              </Surface>
            </div>
          </div>
        )}
      </div>
    </AccountCenter>
  );
}
