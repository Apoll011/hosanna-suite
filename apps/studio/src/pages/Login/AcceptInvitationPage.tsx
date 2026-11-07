/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Spinner } from "@/src/components/common";
import { useAppNavigate } from "@/src/hooks/useAppNavigate";
import { useI18n } from "@/src/lib/i18n";
import { Building2, ShieldAlert } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { authClient } from "../../lib/authClient";
import LoginLayout from "./Layout";

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

export const AcceptInvitationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const invitationId = searchParams.get("id");
  const { navigate } = useAppNavigate();
  const { refetch, user, isLoading: isAuthLoading } = useAuth();
  const { t } = useI18n();

  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [actionLoading, setActionLoading] = useState<
    "accept" | "reject" | null
  >(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!invitationId) {
      setErrorMsg("Identificador de convite inválido ou ausente.");
      setIsFetching(false);
      return;
    }

    if (isAuthLoading) {
      return;
    }

    if (!user) {
      localStorage.setItem("pending_invitation_id", invitationId);
      navigate("/register", { replace: true });
      return;
    }

    const fetchInvitation = async () => {
      setIsFetching(true);
      setErrorMsg("");
      try {
        const { data, error } = await authClient.organization.getInvitation({
          query: {
            id: invitationId,
          },
        });

        if (error || !data) {
          setErrorMsg(
            error?.message ||
              "Não foi possível carregar os detalhes do convite.",
          );
        } else {
          setInvitation(data as unknown as InvitationData);
        }
      } catch (err: unknown) {
        setErrorMsg(
          (err as Error)?.message || "Ocorreu um erro ao carregar o convite.",
        );
      } finally {
        setIsFetching(false);
      }
    };

    fetchInvitation();
  }, [invitationId, user, isAuthLoading, navigate]);

  const handleAccept = async () => {
    if (!invitationId) return;
    setActionLoading("accept");
    setErrorMsg("");

    try {
      const { data, error } = await authClient.organization.acceptInvitation({
        invitationId,
      });

      if (error) {
        setErrorMsg(error.message || "Falha ao aceitar o convite.");
        setActionLoading(null);
        return;
      }

      localStorage.removeItem("pending_invitation_id");
      setSuccessMsg(t("auth.acceptInvitation.successDesc"));

      await refetch();
      const orgData = data as {
        organization?: { slug?: string };
        slug?: string;
      } | null;
      const orgSlug = orgData?.organization?.slug || orgData?.slug;
      if (orgSlug) {
        localStorage.setItem("active_org_slug", orgSlug);
        await authClient.organization.setActive({ organizationSlug: orgSlug });
        setTimeout(() => {
          navigate(`/${orgSlug}/folders`, { replace: true });
        }, 1000);
      } else {
        setTimeout(() => {
          navigate("/onboarding", { replace: true });
        }, 1000);
      }
    } catch (err: unknown) {
      setErrorMsg(
        (err as Error)?.message || "Erro inesperado ao aceitar convite.",
      );
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
        setErrorMsg(error.message || "Falha ao recusar o convite.");
        setActionLoading(null);
        return;
      }

      localStorage.removeItem("pending_invitation_id");
      setSuccessMsg(t("settings.members.inviteCancelled", { email: "" }));
      setTimeout(() => {
        if (user) {
          navigate("/onboarding", { replace: true });
        } else {
          navigate("/login", { replace: true });
        }
      }, 1200);
    } catch (err: unknown) {
      setErrorMsg(
        (err as Error)?.message || "Erro inesperado ao recusar convite.",
      );
      setActionLoading(null);
    }
  };

  return (
    <LoginLayout
      headerTitle={t("auth.acceptInvitation.title")}
      headerSubtitle={
        invitation ? `${t("auth.acceptInvitation.invitedTo")}` : undefined
      }
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
                {invitation.organizationName ||
                  invitation.organizationId ||
                  "Organização Hosanna"}
              </span>
              <span className="text-xs sm:text-sm text-m3-secondary mt-1 block">
                {t("settings.account.profile.role")}:{" "}
                <strong className="text-m3-primary font-semibold">
                  {invitation.role}
                </strong>
              </span>
            </div>

            {invitation.status !== "pending" && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 text-xs rounded-lg border border-amber-200 dark:border-amber-800">
                Estado: <strong>{invitation.status}</strong>.
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleReject}
                disabled={actionLoading !== null}
                className="text-xs sm:text-sm font-medium text-m3-secondary hover:text-m3-danger hover:underline py-2 disabled:opacity-50 cursor-pointer"
              >
                {t("auth.acceptInvitation.rejectBtn")}
              </button>

              <Button
                variant="primary"
                onClick={handleAccept}
                isLoading={actionLoading === "accept"}
                disabled={
                  actionLoading !== null || invitation.status !== "pending"
                }
                className="h-10 sm:h-11 px-6 rounded-full bg-m3-primary hover:bg-m3-primary-dark text-white font-medium text-sm transition-colors shadow-none border-0"
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
            <p className="text-sm text-m3-secondary">
              {t("auth.acceptInvitation.invalidDesc")}
            </p>
          </div>
        )}
      </div>
    </LoginLayout>
  );
};
