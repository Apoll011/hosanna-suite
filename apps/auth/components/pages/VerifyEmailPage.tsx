"use client";

import { AuthLayout } from "@/components/AuthLayout";
import { authClient } from "@/lib/auth-client";
import { useI18n } from "@/lib/i18n";
import { CheckCircle2, Clock, Loader2, MailCheck, RefreshCw, XCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Button, GoogleTextField } from "@hosanna/ui";

type State = "verifying" | "success" | "expired" | "error" | "pending";

export function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { t } = useI18n();

  const [state, setState] = useState<State>(token ? "verifying" : "pending");
  const [resendEmail, setResendEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState("");

  useEffect(() => {
    if (!token) return;
    void authClient.verifyEmail({ query: { token } }).then(({ error }: { error?: { message?: string } | null }) => {
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

  const handleResend = async (e: FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;
    setResendLoading(true);
    setResendError("");
    const { error } = await authClient.sendVerificationEmail({
      email: resendEmail.trim(),
    });
    setResendLoading(false);
    if (error) {
      setResendError(error.message || "Failed to resend");
      return;
    }
    setResendSuccess(true);
  };

  if (state === "pending") {
    return (
      <AuthLayout
        headerTitle={t("auth.verifyEmail.title")}
        headerSubtitle="We sent a verification link. Click it to activate your account."
        optionalLink="/login"
        optionalMsg={t("auth.forgotPassword.backToLogin")}
      >
        <div className="py-2 flex flex-col items-center text-center gap-5">
          <div className="w-16 h-16 bg-m3-primary/10 rounded-full flex items-center justify-center text-m3-primary">
            <MailCheck className="w-8 h-8" />
          </div>

          <div className="w-full border-t border-m3-border/60 pt-5">
            <p className="text-xs sm:text-sm font-medium text-m3-secondary mb-3">
              Didn&apos;t get the email? Resend:
            </p>
            {resendSuccess ? (
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-2 justify-center">
                <CheckCircle2 className="w-4 h-4" /> {t("auth.forgotPassword.emailSentTitle")}
              </p>
            ) : (
              <form onSubmit={(e) => void handleResend(e)} className="flex flex-col sm:flex-row gap-2.5">
                <div className="flex-1">
                  <GoogleTextField
                    type="email"
                    label={t("auth.forgotPassword.emailLabel")}
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                  />
                </div>
                <Button type="submit" size="md" isLoading={resendLoading} className="rounded-full shrink-0 px-5">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </form>
            )}
            {resendError && <p className="text-xs text-m3-danger mt-2">{resendError}</p>}
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (state === "verifying") {
    return (
      <AuthLayout
        headerTitle={t("auth.verifyEmail.title")}
        headerSubtitle={t("auth.verifyEmail.verifying")}
        optionalLink="/login"
        optionalMsg={t("auth.forgotPassword.backToLogin")}
      >
        <div className="py-12 flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-m3-primary animate-spin" />
        </div>
      </AuthLayout>
    );
  }

  if (state === "success") {
    return (
      <AuthLayout
        headerTitle={t("auth.verifyEmail.successTitle")}
        headerSubtitle={t("auth.verifyEmail.successDesc")}
        optionalLink="/login"
        optionalMsg={t("auth.resetPassword.goToLoginBtn")}
      >
        <div className="py-4 flex flex-col items-center text-center gap-4 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/50 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <Link
            href="/login"
            className="inline-flex items-center justify-center h-10 px-6 rounded-full bg-m3-primary hover:bg-m3-primary-dark text-white font-medium text-sm transition-colors"
          >
            {t("auth.login.loginBtn")}
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (state === "expired") {
    return (
      <AuthLayout
        headerTitle={t("auth.acceptInvitation.invalidTitle")}
        headerSubtitle={t("auth.acceptInvitation.invalidDesc")}
        optionalLink="/login"
        optionalMsg={t("auth.forgotPassword.backToLogin")}
      >
        <div className="py-4 flex flex-col items-center text-center gap-4 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/50 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400 mb-2">
            <Clock className="w-8 h-8" />
          </div>
          <form onSubmit={(e) => void handleResend(e)} className="w-full flex flex-col sm:flex-row gap-2.5 mt-2">
            <div className="flex-1">
              <GoogleTextField
                type="email"
                label={t("auth.forgotPassword.emailLabel")}
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
              />
            </div>
            <Button type="submit" size="md" isLoading={resendLoading} className="rounded-full shrink-0 px-5">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </form>
          {resendSuccess && (
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              {t("auth.forgotPassword.emailSentTitle")}
            </p>
          )}
          {resendError && <p className="text-xs text-m3-danger">{resendError}</p>}
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
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
          href="/login"
          className="inline-flex items-center justify-center h-10 px-6 rounded-full bg-m3-primary hover:bg-m3-primary-dark text-white font-medium text-sm transition-colors"
        >
          {t("auth.forgotPassword.backToLogin")}
        </Link>
      </div>
    </AuthLayout>
  );
}
