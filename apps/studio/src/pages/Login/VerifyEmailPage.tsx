/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppLink } from "@/src/components/AppLink";
import { Button } from "@/src/components/common";
import { useI18n } from "@/src/lib/i18n";
import {
  CheckCircle2,
  Clock,
  Loader2,
  MailCheck,
  RefreshCw,
  XCircle,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { authClient } from "../../lib/authClient";
import LoginLayout from "./Layout";
import { GoogleTextField } from "./components/GoogleTextField";

type State = "verifying" | "success" | "expired" | "error" | "pending";

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { t } = useI18n();

  const [state, setState] = useState<State>(token ? "verifying" : "pending");
  const [resendEmail, setResendEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState("");

  useEffect(() => {
    if (!token) return;
    authClient.verifyEmail({ query: { token } }).then(({ error }) => {
      if (!error) {
        setState("success");
        setTimeout(() => {
          window.location.href = "/login";
        }, 2500);
        return;
      }
      const msg = error.message?.toLowerCase() || "";
      if (msg.includes("expir")) {
        setState("expired");
      } else {
        setState("error");
      }
    });
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;
    setResendLoading(true);
    setResendError("");
    const { error } = await authClient.sendVerificationEmail({
      email: resendEmail.trim(),
    });
    setResendLoading(false);
    if (error) {
      setResendError(error.message || "Erro ao reenviar");
      return;
    }
    setResendSuccess(true);
  };

  // ── Pending (no token) ──────────────────────────────────────────────────
  if (state === "pending") {
    return (
      <LoginLayout
        headerTitle={t("auth.verifyEmail.title")}
        headerSubtitle="Enviámos um link de verificação. Clique no link para ativar a sua conta."
        optionalLink="/login"
        optionalMsg={t("auth.forgotPassword.backToLogin")}
      >
        <div className="py-2 flex flex-col items-center text-center gap-5">
          <div className="w-16 h-16 bg-m3-primary/10 rounded-full flex items-center justify-center text-m3-primary">
            <MailCheck className="w-8 h-8" />
          </div>

          <div className="w-full border-t border-m3-border/60 pt-5">
            <p className="text-xs sm:text-sm font-medium text-m3-secondary mb-3">
              Não recebeu o e-mail? Reenviar:
            </p>
            {resendSuccess ? (
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-2 justify-center">
                <CheckCircle2 className="w-4 h-4" />{" "}
                {t("auth.forgotPassword.emailSentTitle")}
              </p>
            ) : (
              <form
                onSubmit={handleResend}
                className="flex flex-col sm:flex-row gap-2.5"
              >
                <div className="flex-1">
                  <GoogleTextField
                    type="email"
                    label={t("auth.forgotPassword.emailLabel")}
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  isLoading={resendLoading}
                  className="h-12.5 sm:h-13.5 px-5 rounded-full bg-m3-primary hover:bg-m3-primary-dark text-white font-medium text-sm transition-colors shadow-none border-0 shrink-0"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </form>
            )}
            {resendError && (
              <p className="text-xs text-m3-danger mt-2">{resendError}</p>
            )}
          </div>
        </div>
      </LoginLayout>
    );
  }

  // ── Verifying ───────────────────────────────────────────────────────────
  if (state === "verifying") {
    return (
      <LoginLayout
        headerTitle={t("auth.verifyEmail.title")}
        headerSubtitle={t("auth.verifyEmail.verifying")}
        optionalLink="/login"
        optionalMsg={t("auth.forgotPassword.backToLogin")}
      >
        <div className="py-12 flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-m3-primary animate-spin" />
        </div>
      </LoginLayout>
    );
  }

  // ── Success ─────────────────────────────────────────────────────────────
  if (state === "success") {
    return (
      <LoginLayout
        headerTitle={t("auth.verifyEmail.successTitle")}
        headerSubtitle={t("auth.verifyEmail.successDesc")}
        optionalLink="/login"
        optionalMsg={t("auth.resetPassword.goToLoginBtn")}
      >
        <div className="py-4 flex flex-col items-center text-center gap-4 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/50 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <AppLink
            to="/login"
            className="inline-flex items-center justify-center h-10 px-6 rounded-full bg-m3-primary hover:bg-m3-primary-dark text-white font-medium text-sm transition-colors"
          >
            {t("auth.login.loginBtn")}
          </AppLink>
        </div>
      </LoginLayout>
    );
  }

  // ── Expired ─────────────────────────────────────────────────────────────
  if (state === "expired") {
    return (
      <LoginLayout
        headerTitle={t("auth.acceptInvitation.invalidTitle")}
        headerSubtitle={t("auth.acceptInvitation.invalidDesc")}
        optionalLink="/login"
        optionalMsg={t("auth.forgotPassword.backToLogin")}
      >
        <div className="py-4 flex flex-col items-center text-center gap-4 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/50 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400 mb-2">
            <Clock className="w-8 h-8" />
          </div>
          <form
            onSubmit={handleResend}
            className="w-full flex flex-col sm:flex-row gap-2.5 mt-2"
          >
            <div className="flex-1">
              <GoogleTextField
                type="email"
                label={t("auth.forgotPassword.emailLabel")}
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              isLoading={resendLoading}
              className="h-12.5 sm:h-13.5 px-5 rounded-full bg-m3-primary hover:bg-m3-primary-dark text-white font-medium text-sm transition-colors shadow-none border-0 shrink-0"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </form>
          {resendSuccess && (
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              {t("auth.forgotPassword.emailSentTitle")}
            </p>
          )}
          {resendError && (
            <p className="text-xs text-m3-danger">{resendError}</p>
          )}
        </div>
      </LoginLayout>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────
  return (
    <LoginLayout
      headerTitle={t("auth.verifyEmail.errorTitle")}
      headerSubtitle={t("auth.verifyEmail.errorDesc")}
      optionalLink="/login"
      optionalMsg={t("auth.forgotPassword.backToLogin")}
    >
      <div className="py-4 flex flex-col items-center text-center gap-4 animate-in zoom-in-95 duration-300">
        <div className="w-16 h-16 bg-m3-danger/10 rounded-full flex items-center justify-center text-m3-danger mb-2">
          <XCircle className="w-8 h-8" />
        </div>
        <Link
          to="/login"
          className="inline-flex items-center justify-center h-10 px-6 rounded-full bg-m3-primary hover:bg-m3-primary-dark text-white font-medium text-sm transition-colors"
        >
          {t("auth.forgotPassword.backToLogin")}
        </Link>
      </div>
    </LoginLayout>
  );
};
