"use client";

import { AuthLayout } from "@/components/AuthLayout";
import { authClient } from "@/lib/auth-client";
import { useI18n } from "@/lib/i18n";
import { getStudioUrl } from "@/lib/redirect";
import { Button, GoogleTextField, Spinner } from "@hosanna/ui";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  LogOut,
  MailCheck,
  PlusCircle,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

interface UserInvitation {
  id: string;
  organizationId: string;
  organizationName?: string;
  email: string;
  role: string;
  status: "pending" | "accepted" | "rejected" | "canceled";
}

type OrgSummary = { id: string; name: string; slug: string; logo?: string | null };

const PLAN_PRICING = {
  monthly: { amount: "€12", period: "/mo" },
  annual: { amount: "€120", period: "/yr" },
};

export function OnboardingPage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [mode, setMode] = useState<"choose" | "create" | "trial">("choose");
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [newOrg, setNewOrg] = useState<{ id: string; slug: string } | null>(null);
  const [annual, setAnnual] = useState(false);
  const [invitations, setInvitations] = useState<UserInvitation[]>([]);
  const [isFetchingInvitations, setIsFetchingInvitations] = useState(true);
  const [processingInvId, setProcessingInvId] = useState<string | null>(null);
  const [existingOrgs, setExistingOrgs] = useState<OrgSummary[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(true);
  const [isOrgSwitcherOpen, setIsOrgSwitcherOpen] = useState(false);
  const [switchingOrgId, setSwitchingOrgId] = useState<string | null>(null);

  useEffect(() => {
    const pendingInvitationId = localStorage.getItem("pending_invitation_id");
    if (pendingInvitationId) {
      router.replace(`/accept-invitation?id=${pendingInvitationId}`);
    }
  }, [router]);

  useEffect(() => {
    void authClient.getSession().then((session: { data?: { user?: unknown } | null }) => {
      if (!session.data?.user) {
        router.replace("/login");
      }
    });
  }, [router]);

  const fetchUserInvitations = useCallback(async () => {
    setIsFetchingInvitations(true);
    try {
      const res = await authClient.organization.listUserInvitations({ query: {} });
      if (res.data) {
        const pendingInvs = (res.data as unknown as UserInvitation[]).filter(
          (inv) => inv.status === "pending",
        );
        setInvitations(pendingInvs);
      }
    } catch {
    } finally {
      setIsFetchingInvitations(false);
    }
  }, []);

  useEffect(() => {
    void fetchUserInvitations();

    let cancelled = false;
    setIsLoadingOrgs(true);

    void (async () => {
      try {
        const [listRes, activeRes] = await Promise.all([
          authClient.organization.list({}),
          authClient.organization.getFullOrganization({ query: {} }),
        ]);
        if (cancelled) return;

        const list = (listRes.data ?? []) as OrgSummary[];
        setExistingOrgs(list);

        const activeFromSession = activeRes.data as OrgSummary | null | undefined;
        const storedSlug =
          typeof localStorage !== "undefined" ? localStorage.getItem("active_org_slug") : null;
        const resolved =
          (activeFromSession && list.find((o) => o.id === activeFromSession.id)) ||
          (storedSlug ? list.find((o) => o.slug === storedSlug) : undefined) ||
          list[0] ||
          null;

        if (resolved) {
          setActiveOrgId(resolved.id);
          localStorage.setItem("active_org_slug", resolved.slug);
          if (!activeFromSession || activeFromSession.id !== resolved.id) {
            void authClient.organization.setActive({ organizationSlug: resolved.slug });
          }
        } else {
          setActiveOrgId(null);
        }
      } catch {
        if (!cancelled) {
          setExistingOrgs([]);
          setActiveOrgId(null);
        }
      } finally {
        if (!cancelled) setIsLoadingOrgs(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchUserInvitations]);

  const activeOrg = useMemo(
    () => existingOrgs.find((o) => o.id === activeOrgId) ?? null,
    [existingOrgs, activeOrgId],
  );
  const hasMultipleOrgs = existingOrgs.length > 1;

  useEffect(() => {
    const trimmed = orgSlug.trim();
    if (!trimmed) {
      setSlugStatus("idle");
      return;
    }
    setSlugStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const { error } = await authClient.organization.checkSlug({ slug: trimmed });
        setSlugStatus(error ? "taken" : "available");
      } catch {
        setSlugStatus("idle");
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [orgSlug]);

  const goToStudio = (slug: string) => {
    localStorage.setItem("active_org_slug", slug);
    window.location.assign(`${getStudioUrl()}/${slug}`);
  };

  const switchOrganization = async (org: OrgSummary) => {
    if (org.id === activeOrgId || switchingOrgId) return;
    setSwitchingOrgId(org.id);
    setErrorMsg("");
    try {
      const { error } = await authClient.organization.setActive({ organizationId: org.id });
      if (error) {
        setErrorMsg(error.message || "Failed to switch workspace.");
        return;
      }
      localStorage.setItem("active_org_slug", org.slug);
      setActiveOrgId(org.id);
      setIsOrgSwitcherOpen(false);
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || "Failed to switch workspace.");
    } finally {
      setSwitchingOrgId(null);
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    setProcessingInvId(invitationId);
    setErrorMsg("");
    try {
      const { data, error } = await authClient.organization.acceptInvitation({ invitationId });
      if (error) {
        setErrorMsg(error.message || "Could not accept invitation.");
        setProcessingInvId(null);
        return;
      }
      const orgData = data as { organization?: { slug?: string }; slug?: string } | null;
      const slug = orgData?.organization?.slug || orgData?.slug;
      if (slug) {
        await authClient.organization.setActive({ organizationSlug: slug });
        goToStudio(slug);
      } else {
        await fetchUserInvitations();
        setProcessingInvId(null);
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || "Failed to accept invitation.");
      setProcessingInvId(null);
    }
  };

  const handleRejectInvitation = async (invitationId: string) => {
    setProcessingInvId(invitationId);
    setErrorMsg("");
    try {
      const { error } = await authClient.organization.rejectInvitation({ invitationId });
      if (error) {
        setErrorMsg(error.message || "Could not decline invitation.");
        setProcessingInvId(null);
        return;
      }
      setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || "Failed to decline invitation.");
    } finally {
      setProcessingInvId(null);
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    const slug = orgSlug.trim();
    const { data, error } = await authClient.organization.create({
      name: orgName.trim(),
      slug,
    });

    if (error) {
      setIsLoading(false);
      setErrorMsg(error.message || "Failed to create organization.");
      return;
    }

    localStorage.setItem("active_org_slug", slug);
    await authClient.organization.setActive({ organizationSlug: slug });
    setIsLoading(false);

    const orgId = (data as { id?: string } | null)?.id;
    if (orgId) {
      setNewOrg({ id: orgId, slug });
      setMode("trial");
    } else {
      goToStudio(slug);
    }
  };

  const handleStartTrial = async () => {
    if (!newOrg) return;
    setErrorMsg("");
    setCheckoutLoading(true);
    const studio = getStudioUrl();
    try {
      const { error } = await authClient.subscription.upgrade({
        plan: "cloud",
        referenceId: newOrg.id,
        customerType: "organization",
        annual,
        locale,
        successUrl: `${studio}/${newOrg.slug}/organization?tab=billing&billing=success`,
        cancelUrl: `${studio}/${newOrg.slug}`,
      });
      if (error) {
        setErrorMsg(error.message || "Could not start checkout.");
        setCheckoutLoading(false);
      }
      // On success Better Auth redirects to Stripe.
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || "Could not start checkout.");
      setCheckoutLoading(false);
    }
  };

  const logout = async () => {
    await authClient.signOut();
    router.replace("/login");
  };

  const getHeaderTitle = () => {
    if (mode === "create") return t("onboarding.createOrgTab");
    if (mode === "trial") return t("onboarding.trial.title");
    return t("brand.name");
  };

  const getHeaderSubtitle = () => {
    if (mode === "create") return t("onboarding.step1Desc");
    if (mode === "trial") return t("onboarding.trial.desc");
    return t("onboarding.step1Desc");
  };

  return (
    <AuthLayout
      headerTitle={getHeaderTitle()}
      headerSubtitle={getHeaderSubtitle()}
      errorMsg={errorMsg}
    >
      {mode === "trial" && newOrg && (
        <div className="text-center space-y-5">
          <div className="bg-m3-sidebar/60 border border-m3-border/60 rounded-lg p-4 text-left space-y-2.5">
            {(
              [
                "onboarding.trial.features.sync",
                "onboarding.trial.features.unlimited",
                "onboarding.trial.features.print",
                "onboarding.trial.features.backups",
              ] as const
            ).map((key) => (
              <div key={key} className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-m3-primary shrink-0" />
                <span className="text-sm text-m3-text">{t(key)}</span>
              </div>
            ))}
          </div>

          <div className="bg-m3-sidebar/60 border border-m3-border/60 rounded-lg p-3">
            <div className="flex items-center gap-2 bg-m3-card border border-m3-border rounded-full p-1 mb-3">
              <button
                type="button"
                onClick={() => setAnnual(false)}
                disabled={checkoutLoading}
                className={`flex-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 ${
                  !annual ? "bg-m3-primary text-white shadow-xs" : "text-m3-secondary"
                }`}
              >
                {t("settings.billing.monthly")}
              </button>
              <button
                type="button"
                onClick={() => setAnnual(true)}
                disabled={checkoutLoading}
                className={`flex-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 ${
                  annual ? "bg-m3-primary text-white shadow-xs" : "text-m3-secondary"
                }`}
              >
                {t("settings.billing.annual")}
              </button>
            </div>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-2xl font-semibold text-m3-text">
                {annual ? PLAN_PRICING.annual.amount : PLAN_PRICING.monthly.amount}
              </span>
              <span className="text-xs sm:text-sm text-m3-secondary">
                {annual ? PLAN_PRICING.annual.period : PLAN_PRICING.monthly.period}
              </span>
            </div>
            {annual && (
              <p className="mt-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 text-center flex items-center justify-center gap-1">
                <Check className="w-3.5 h-3.5 shrink-0" />
                {t("settings.billing.annualSavings")}
              </p>
            )}
          </div>

          <Button
            variant="primary"
            className="w-full rounded-full"
            isLoading={checkoutLoading}
            disabled={checkoutLoading}
            icon={<CreditCard className="w-4 h-4" />}
            onClick={() => void handleStartTrial()}
          >
            {t("onboarding.trial.startBtn")}
          </Button>
          <p className="text-xs text-m3-secondary">{t("onboarding.trial.note")}</p>
          <button
            type="button"
            onClick={() => goToStudio(newOrg.slug)}
            className="text-xs font-medium text-m3-primary hover:underline cursor-pointer"
          >
            Skip for now → Studio
          </button>
        </div>
      )}

      {mode === "choose" && (
        <div className="space-y-6">
          {isLoadingOrgs ? (
            <div className="flex items-center justify-center p-6">
              <Spinner size="sm" />
            </div>
          ) : activeOrg ? (
            <div className="space-y-3 relative">
              <h3 className="text-label px-1">{t("onboarding.activeWorkspace")}</h3>
              <div className="rounded-lg border border-m3-primary/30 bg-m3-primary/5 p-4 space-y-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 shrink-0 overflow-hidden rounded-full bg-m3-primary/10 text-m3-primary flex items-center justify-center border border-m3-border/60">
                    {activeOrg.logo ? (
                      <img src={activeOrg.logo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-m3-text text-sm truncate">{activeOrg.name}</h3>
                    <p className="text-xs text-m3-secondary truncate">@{activeOrg.slug}</p>
                  </div>
                  <Check className="w-4 h-4 shrink-0 text-m3-primary" />
                </div>
                <Button
                  variant="primary"
                  className="w-full rounded-full"
                  icon={<ArrowRight className="w-4 h-4" />}
                  onClick={() => {
                    void authClient.organization
                      .setActive({ organizationSlug: activeOrg.slug })
                      .finally(() => goToStudio(activeOrg.slug));
                  }}
                >
                  {t("onboarding.continueToStudio")}
                </Button>
              </div>

              {hasMultipleOrgs && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsOrgSwitcherOpen((v) => !v)}
                    aria-haspopup="menu"
                    aria-expanded={isOrgSwitcherOpen}
                    className="w-full inline-flex items-center justify-between gap-2 rounded-lg border border-m3-border bg-transparent px-3.5 py-2.5 text-xs font-medium text-m3-secondary hover:text-m3-text hover:bg-m3-hover transition-colors cursor-pointer"
                  >
                    <span>{t("onboarding.switchWorkspace")}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                        isOrgSwitcherOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isOrgSwitcherOpen && (
                    <div
                      className="mt-2 rounded-xl border border-m3-border bg-m3-card shadow-lg p-2 space-y-1"
                      role="menu"
                    >
                      {existingOrgs.map((org) => {
                        const isActive = org.id === activeOrg.id;
                        const isSwitching = switchingOrgId === org.id;
                        return (
                          <button
                            key={org.id}
                            type="button"
                            role="menuitem"
                            disabled={isActive || Boolean(switchingOrgId)}
                            onClick={() => void switchOrganization(org)}
                            className={`w-full flex items-center gap-2.5 px-2.5 py-2 min-h-10 rounded-md text-left transition-colors ${
                              isActive
                                ? "bg-m3-primary/10 text-m3-primary cursor-default"
                                : "text-m3-text hover:bg-m3-hover cursor-pointer disabled:opacity-60"
                            }`}
                          >
                            <div className="w-7 h-7 rounded-md shrink-0 overflow-hidden flex items-center justify-center bg-m3-primary/10 border border-m3-border/60 text-[11px] font-semibold text-m3-primary">
                              {org.logo ? (
                                <img src={org.logo} alt="" className="w-full h-full object-cover" />
                              ) : (
                                (org.name?.trim().charAt(0) || "·").toUpperCase()
                              )}
                            </div>
                            <span className="flex-1 min-w-0">
                              <span className="block text-xs font-semibold truncate">
                                {org.name}
                              </span>
                              <span className="block text-caption text-m3-secondary truncate">
                                @{org.slug}
                              </span>
                            </span>
                            {isSwitching ? (
                              <Spinner size="sm" />
                            ) : isActive ? (
                              <Check className="w-4 h-4 shrink-0 text-m3-primary" />
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}

          {isFetchingInvitations ? (
            <div className="flex items-center justify-center p-4">
              <Spinner size="sm" label={t("settings.members.loadingInvites")} />
            </div>
          ) : invitations.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <MailCheck className="w-4 h-4 text-m3-primary" />
                <h3 className="text-label">
                  {t("settings.members.pendingInvites", { count: invitations.length })}
                </h3>
              </div>
              <div className="space-y-2.5">
                {invitations.map((inv) => {
                  const isProcessing = processingInvId === inv.id;
                  return (
                    <div
                      key={inv.id}
                      className="p-4 bg-m3-primary/5 border border-m3-primary/25 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-m3-primary" />
                          <span className="font-semibold text-m3-text text-sm">
                            {inv.organizationName || inv.organizationId}
                          </span>
                        </div>
                        <p className="text-xs text-m3-secondary">
                          {t("settings.account.profile.role")}:{" "}
                          <span className="font-medium text-m3-text capitalize">{inv.role}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => void handleRejectInvitation(inv.id)}
                          className="h-8 px-3 rounded-full border border-m3-border text-m3-text hover:bg-m3-danger/10 hover:text-m3-danger transition-colors text-xs font-medium cursor-pointer"
                        >
                          {t("auth.acceptInvitation.rejectBtn")}
                        </button>
                        <Button
                          variant="primary"
                          size="sm"
                          isLoading={isProcessing}
                          disabled={isProcessing}
                          onClick={() => void handleAcceptInvitation(inv.id)}
                          className="rounded-full"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" />
                          {t("auth.acceptInvitation.acceptBtn")}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="space-y-3">
            {(invitations.length > 0 || existingOrgs.length > 0) && (
              <h3 className="text-label px-1">{t("onboarding.otherOptions")}</h3>
            )}
            <button
              type="button"
              onClick={() => setMode("create")}
              className="w-full flex items-center p-4 border border-m3-border hover:border-m3-primary rounded-lg transition-all group text-left bg-transparent hover:bg-m3-hover cursor-pointer"
            >
              <div className="w-10 h-10 bg-m3-primary/10 text-m3-primary rounded-full flex items-center justify-center mr-3.5">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-m3-text text-sm">{t("onboarding.createOrgTab")}</h3>
                <p className="text-xs text-m3-secondary">{t("onboarding.step1Desc")}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-m3-secondary group-hover:text-m3-primary group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex items-center text-xs sm:text-sm font-medium text-m3-secondary hover:text-m3-text transition-colors gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t("onboarding.logout")}</span>
            </button>
          </div>
        </div>
      )}

      {mode === "create" && (
        <form onSubmit={(e) => void handleCreate(e)} className="space-y-5">
          <GoogleTextField
            label={t("onboarding.orgNameLabel")}
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            required
            autoFocus
          />
          <GoogleTextField
            label={t("onboarding.slugLabel")}
            value={orgSlug}
            onChange={(e) => setOrgSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
            required
            error={slugStatus === "taken" ? t("onboarding.slugTaken") : undefined}
            helperText={
              slugStatus === "checking"
                ? t("onboarding.checkingSlug")
                : slugStatus === "available"
                  ? t("onboarding.slugAvailable")
                  : "studio.hosanna.live/slug"
            }
            trailingIcon={
              slugStatus === "checking" ? (
                <Spinner size="sm" />
              ) : slugStatus === "available" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : slugStatus === "taken" ? (
                <XCircle className="w-4 h-4 text-m3-danger" />
              ) : undefined
            }
          />
          <div className="flex items-center justify-between gap-3 pt-3">
            <button
              type="button"
              onClick={() => setMode("choose")}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-m3-secondary hover:text-m3-text py-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t("common.back")}</span>
            </button>
            <Button
              type="submit"
              size="md"
              disabled={
                isLoading || !orgName.trim() || !orgSlug.trim() || slugStatus !== "available"
              }
              isLoading={isLoading}
              className="rounded-full"
            >
              {t("onboarding.createOrgBtn")}
            </Button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
