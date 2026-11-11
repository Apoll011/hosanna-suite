"use client";

import { AccountCenter } from "@/components/account/AccountCenter";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { authClient } from "@/lib/auth-client";
import { useI18n } from "@/lib/i18n";
import { Badge, Button, Can, Cannot, PageHeader, Spinner, Surface, useCan } from "@hosanna/ui";
import { AlertTriangle, CalendarRange, Check, CreditCard, Receipt, RotateCcw } from "lucide-react";
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
  const { organization, isLoading: orgLoading } = useActiveOrganization();
  const canManage = useCan("billing.manage");
  const canAccess = useCan("billing.access");

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

  const handleCheckout = async () => {
    if (!canManage.granted || !organization) return;
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
    if (!canManage.granted || !organization) return;
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
    if (!canManage.granted || !organization) return;
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

  if (!canAccess.loading && !canAccess.granted) {
    return (
      <AccountCenter toast={toast}>
        <div className="space-y-6">
          <PageHeader
            title={t("settings.billing.title")}
            description={t("settings.billing.desc")}
          />
          <div className="overflow-hidden rounded-2xl border border-m3-border/70 bg-m3-card">
            <div className="h-28 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900" />
            <div className="-mt-8 px-6 pb-8 text-center sm:px-10">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-m3-border bg-m3-card shadow-sm">
                <CreditCard className="h-7 w-7 text-m3-secondary" />
              </div>
              <h3 className="text-lg font-semibold text-m3-text">
                {t("settings.billing.noAccessTitle")}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-m3-secondary">
                {t("settings.billing.noAccessDesc")}
              </p>
            </div>
          </div>
        </div>
      </AccountCenter>
    );
  }

  const loadingInitial = isLoading && subscriptions === null;
  const refreshing = isLoading && subscriptions !== null;
  const isAnnual = activeSub?.billingInterval === "year";
  const price = isAnnual ? planPricing.annual : planPricing.monthly;

  return (
    <AccountCenter toast={toast}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <PageHeader
            title={t("settings.billing.title")}
            description={t("settings.billing.desc")}
          />
          <Cannot permission="billing.manage">
            <span className="inline-flex w-fit items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              {t("settings.billing.readOnly")}
            </span>
          </Cannot>
        </div>

        {loadingInitial || canAccess.loading ? (
          <div className="flex justify-center py-12">
            <Spinner label={t("settings.billing.loading")} />
          </div>
        ) : fetchError && subscriptions === null ? (
          <Surface>
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <AlertTriangle className="h-6 w-6 text-m3-danger" />
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

            {activeSub.cancelAtPeriodEnd ? (
              <div className="flex flex-col justify-between gap-3 rounded-xl border border-m3-border bg-m3-card px-4 py-3.5 sm:flex-row sm:items-center">
                <div className="text-sm text-m3-text">
                  <p className="font-medium">
                    {t("settings.billing.cancelingTitle", {
                      date: formatDate(activeSub.periodEnd),
                    })}
                  </p>
                  <p className="mt-0.5 text-m3-secondary">{t("settings.billing.cancelingDesc")}</p>
                </div>
                <Can permission="billing.manage">
                  <Button
                    variant="outline"
                    size="sm"
                    isLoading={pendingAction === "restore"}
                    onClick={() => void handleRestore()}
                    icon={<RotateCcw className="h-3.5 w-3.5" />}
                  >
                    {t("settings.billing.restore")}
                  </Button>
                </Can>
              </div>
            ) : null}

            <div className="overflow-hidden rounded-2xl border border-m3-border/70 bg-m3-card shadow-sm">
              <div className="relative overflow-hidden bg-gradient-to-br from-sky-800 via-slate-800 to-slate-950 px-5 py-6 sm:px-8 sm:py-8">
                <div
                  className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-sky-400/20 blur-3xl"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-indigo-400/15 blur-3xl"
                  aria-hidden
                />
                <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                  <div className="min-w-0 space-y-4 text-white">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={activeSub.status === "trialing" ? "warning" : "success"}
                        size="md"
                      >
                        {activeSub.status === "trialing"
                          ? t("settings.billing.status.trialing")
                          : t("settings.billing.status.active")}
                      </Badge>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
                        {t("settings.billing.currentPlanTitle")}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                        {t("settings.billing.planName")}
                      </h3>
                      <p className="mt-1.5 max-w-lg text-sm text-white/75">
                        {t("settings.billing.planDesc")}
                      </p>
                      {activeSub.status === "trialing" && activeSub.trialEnd ? (
                        <p className="mt-2 text-sm text-white/60">
                          {t("settings.billing.trialUntil", {
                            date: formatDate(activeSub.trialEnd),
                          })}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="text-4xl font-semibold tabular-nums tracking-tight sm:text-5xl">
                        {price.amount}
                      </span>
                      <span className="text-sm text-white/70">
                        {price.period}
                        {activeSub.billingInterval ? (
                          <>
                            {" "}
                            ·{" "}
                            {isAnnual
                              ? t("settings.billing.annual")
                              : t("settings.billing.monthly")}
                          </>
                        ) : null}
                      </span>
                    </div>
                  </div>

                  <Can permission="billing.manage">
                    <div className="shrink-0 space-y-2 rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm lg:min-w-[220px]">
                      <Button
                        variant="primary"
                        className="w-full"
                        isLoading={pendingAction === "portal"}
                        icon={<CreditCard className="h-4 w-4" />}
                        onClick={() => void handlePortal()}
                      >
                        {t("settings.billing.manage")}
                      </Button>
                      <p className="text-xs leading-relaxed text-white/70">
                        {t("settings.billing.manageDesc")}
                      </p>
                    </div>
                  </Can>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-px bg-m3-border/60 sm:grid-cols-2">
                <div className="flex items-start gap-3 bg-m3-card px-5 py-5 sm:px-6">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-m3-primary/10 text-m3-primary">
                    <CalendarRange className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-m3-secondary">
                      {t("settings.billing.currentPeriod")}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-m3-text">
                      {formatDate(activeSub.periodStart)} → {formatDate(activeSub.periodEnd)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-m3-card px-5 py-5 sm:px-6">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-m3-primary/10 text-m3-primary">
                    <Receipt className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-m3-secondary">
                      {t("settings.billing.nextCharge")}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-m3-text">
                      {activeSub.cancelAtPeriodEnd ? "—" : formatDate(activeSub.periodEnd)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-m3-border/60 px-5 py-5 sm:px-6">
                <p className="mb-3 text-sm font-semibold text-m3-text">
                  {t("settings.billing.includedTitle")}
                </p>
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {PLAN_FEATURE_KEYS.map((key) => (
                    <li key={key} className="flex items-center gap-2.5 text-sm text-m3-text">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                        <Check className="h-3 w-3" />
                      </span>
                      {t(key)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {refreshing ? (
              <p className="text-xs text-m3-secondary">{t("settings.billing.loading")}</p>
            ) : null}

            <div className="overflow-hidden rounded-2xl border border-m3-border/70 bg-m3-card shadow-sm">
              <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="relative overflow-hidden bg-gradient-to-br from-sky-800 via-slate-800 to-slate-950 px-5 py-7 text-white sm:px-8 sm:py-9">
                  <div
                    className="pointer-events-none absolute -right-10 top-0 h-40 w-40 rounded-full bg-sky-400/25 blur-3xl"
                    aria-hidden
                  />
                  <div className="relative space-y-6">
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-200/90">
                        {t("settings.billing.planName")}
                      </p>
                      <h3 className="max-w-md text-2xl font-semibold tracking-tight sm:text-3xl">
                        {t("settings.billing.planDesc")}
                      </h3>
                    </div>

                    <div className="inline-flex rounded-full border border-white/20 bg-white/10 p-1 backdrop-blur-sm">
                      <button
                        type="button"
                        onClick={() => setAnnual(false)}
                        disabled={pendingAction === "checkout"}
                        className={`cursor-pointer rounded-full px-4 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                          !annual ? "bg-white text-slate-900" : "text-white/75 hover:text-white"
                        }`}
                      >
                        {t("settings.billing.monthly")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setAnnual(true)}
                        disabled={pendingAction === "checkout"}
                        className={`cursor-pointer rounded-full px-4 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                          annual ? "bg-white text-slate-900" : "text-white/75 hover:text-white"
                        }`}
                      >
                        {t("settings.billing.annual")}
                      </button>
                    </div>

                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-5xl font-semibold tabular-nums tracking-tight sm:text-6xl">
                          {annual ? planPricing.annual.amount : planPricing.monthly.amount}
                        </span>
                        <span className="text-base text-white/70">
                          {annual ? planPricing.annual.period : planPricing.monthly.period}
                        </span>
                      </div>
                      {annual ? (
                        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-semibold text-emerald-200">
                          <Check className="h-3.5 w-3.5" />
                          {t("settings.billing.annualSavings")}
                        </p>
                      ) : null}
                    </div>

                    <Can
                      permission="billing.manage"
                      fallback={
                        <p className="text-sm text-white/70">{t("settings.billing.askOwner")}</p>
                      }
                    >
                      <div className="space-y-2 border-t border-white/15 pt-5">
                        <Button
                          variant="primary"
                          className="w-full sm:w-auto"
                          isLoading={pendingAction === "checkout"}
                          onClick={() => void handleCheckout()}
                        >
                          {usedTrial
                            ? t("settings.billing.subscribe")
                            : t("settings.billing.startTrial")}
                        </Button>
                        <p className="max-w-md text-xs leading-relaxed text-white/70">
                          {usedTrial
                            ? t("settings.billing.subscribeNote")
                            : t("settings.billing.trialNote")}
                        </p>
                        <p className="text-xs text-white/55">{t("settings.billing.promoHint")}</p>
                      </div>
                    </Can>
                  </div>
                </div>

                <div className="flex flex-col justify-center gap-4 bg-m3-sidebar/40 px-5 py-7 sm:px-7 sm:py-9">
                  <h3 className="text-sm font-semibold text-m3-text">
                    {t("settings.billing.includedTitle")}
                  </h3>
                  <ul className="flex flex-col gap-2.5">
                    {PLAN_FEATURE_KEYS.map((key) => (
                      <li
                        key={key}
                        className="flex items-start gap-3 rounded-xl border border-m3-border/50 bg-m3-card/80 px-3.5 py-3 text-sm text-m3-text"
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-m3-primary/15 text-m3-primary">
                          <Check className="h-3 w-3" />
                        </span>
                        {t(key)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AccountCenter>
  );
}
