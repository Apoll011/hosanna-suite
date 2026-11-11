"use client";

import { AuthLayout } from "@/components/AuthLayout";
import { authClient } from "@/lib/auth/client";
import { useI18n } from "@/lib/ui/i18n";
import { navigateAfterOrgReady } from "@/lib/auth/redirect";
import { Building2, ShieldAlert } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Spinner } from "@hosanna/ui";

interface InvitationData {
  id: string;
  organizationId: string;
  organizationName?: string;
  email: string;
  role: string;
  status: "pending" | "accepted" | "rejected" | "canceled";
  expiresAt: Date;
  inviterId: string;
}

export function AcceptInvitationPage() {
  const searchParams = useSearchParams();
  const invitationId = searchParams.get("id");
  const router = useRouter();
  const { t } = useI18n();

  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [actionLoading, setActionLoading] = useState<"accept" | "reject" | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [userChecked, setUserChecked] = useState(false);

  useEffect(() => {
    if (!invitationId) {
      setErrorMsg("Invalid or missing invitation id.");
      setIsFetching(false);
      setUserChecked(true);
      return;
    }

    let cancelled = false;

    const run = async () => {
      const session = await authClient.getSession();
      if (cancelled) return;

      if (!session.data?.user) {
        localStorage.setItem("pending_invitation_id", invitationId);
        router.replace("/register");
        return;
      }

      setUserChecked(true);
      setIsFetching(true);
      setErrorMsg("");
      try {
        const { data, error } = await authClient.organization.getInvitation({
          query: { id: invitationId },
        });
        if (cancelled) return;
        if (error || !data) {
          setErrorMsg(error?.message || "Could not load invitation details.");
        } else {
          setInvitation(data as unknown as InvitationData);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setErrorMsg((err as Error)?.message || "Failed to load invitation.");
        }
      } finally {
        if (!cancelled) setIsFetching(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [invitationId, router]);

  const handleAccept = async () => {
    if (!invitationId) return;
    setActionLoading("accept");
    setErrorMsg("");

    try {
      const { data, error } = await authClient.organization.acceptInvitation({
        invitationId,
      });

      if (error) {
        setErrorMsg(error.message || "Failed to accept invitation.");
        setActionLoading(null);
        return;
      }

      localStorage.removeItem("pending_invitation_id");
      setSuccessMsg(t("auth.acceptInvitation.successDesc"));

      const orgData = data as {
        organization?: { slug?: string };
        slug?: string;
      } | null;
      const orgSlug = orgData?.organization?.slug || orgData?.slug;
      if (orgSlug) {
        localStorage.setItem("active_org_slug", orgSlug);
        await authClient.organization.setActive({ organizationSlug: orgSlug });
        setTimeout(() => {
          navigateAfterOrgReady(orgSlug, searchParams);
        }, 1000);
      } else {
        setTimeout(() => {
          const returnUrl = searchParams.get("returnUrl") || searchParams.get("redirect");
          if (returnUrl) {
            router.replace(`/onboarding?returnUrl=${encodeURIComponent(returnUrl)}`);
          } else {
            router.replace("/onboarding");
          }
        }, 1000);
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || "Unexpected error accepting invitation.");
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!invitationId) return;
    setActionLoading("reject");
    setErrorMsg("");

    try {
      const { error } = await authClient.organization.rejectInvitation({
        invitationId,
      });

      if (error) {
        setErrorMsg(error.message || "Failed to decline invitation.");
        setActionLoading(null);
        return;
      }

      localStorage.removeItem("pending_invitation_id");
      setSuccessMsg("Invitation declined.");
      setTimeout(() => {
        router.replace("/onboarding");
      }, 1200);
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || "Unexpected error declining invitation.");
      setActionLoading(null);
    }
  };

  if (!userChecked) {
    return (
      <AuthLayout headerTitle={t("auth.acceptInvitation.title")}>
        <div className="flex justify-center py-8">
          <Spinner size="md" label={t("common.loading")} />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      headerTitle={t("auth.acceptInvitation.title")}
      headerSubtitle={invitation ? t("auth.acceptInvitation.invitedTo") : undefined}
      errorMsg={errorMsg}
      redirectMessage={successMsg}
    >
      <div className="py-2 text-center">
        {isFetching ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <Spinner size="md" />
            <p className="text-sm text-m3-secondary">{t("common.loading")}</p>
          </div>
        ) : invitation ? (
          <div className="space-y-6">
            <div className="w-14 h-14 bg-m3-primary/10 text-m3-primary rounded-full flex items-center justify-center mx-auto">
              <Building2 className="w-7 h-7" />
            </div>

            <div className="p-4 bg-m3-sidebar rounded-xl border border-m3-border text-left">
              <span className="text-base sm:text-lg font-medium text-m3-text block">
                {invitation.organizationName || invitation.organizationId || "Hosanna"}
              </span>
              <span className="text-xs sm:text-sm text-m3-secondary mt-1 block">
                {t("settings.account.profile.role")}:{" "}
                <strong className="text-m3-primary font-semibold">{invitation.role}</strong>
              </span>
            </div>

            {invitation.status !== "pending" && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 text-xs rounded-lg border border-amber-200 dark:border-amber-800">
                Status: <strong>{invitation.status}</strong>.
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => void handleReject()}
                disabled={actionLoading !== null}
                className="text-xs sm:text-sm font-medium text-m3-secondary hover:text-m3-danger hover:underline py-2 disabled:opacity-50 cursor-pointer"
              >
                {t("auth.acceptInvitation.rejectBtn")}
              </button>

              <Button
                variant="primary"
                onClick={() => void handleAccept()}
                isLoading={actionLoading === "accept"}
                disabled={actionLoading !== null || invitation.status !== "pending"}
                className="h-10 sm:h-11 px-6 rounded-full"
              >
                <span>{t("auth.acceptInvitation.acceptBtn")}</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-6 space-y-4 text-center">
            <div className="w-14 h-14 bg-m3-danger/10 text-m3-danger rounded-full flex items-center justify-center mx-auto">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <p className="text-sm text-m3-secondary">{t("auth.acceptInvitation.invalidDesc")}</p>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
