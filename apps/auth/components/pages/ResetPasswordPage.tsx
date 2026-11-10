"use client";

import { AuthLayout } from "@/components/AuthLayout";
import { PasswordStrengthMeter } from "@/components/PasswordStrengthMeter";
import { authClient } from "@/lib/auth-client";
import { useI18n } from "@/lib/i18n";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, GoogleTextField } from "@hosanna/ui";

type State = "form" | "success" | "expired" | "error";

export function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();
  const { t } = useI18n();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [state, setState] = useState<State>("form");

  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  if (!token) {
    return (
      <AuthLayout
        headerTitle={t("auth.acceptInvitation.invalidTitle")}
        headerSubtitle={t("auth.verifyEmail.errorDesc")}
        optionalLink="/forgot-password"
        optionalMsg={t("auth.forgotPassword.sendLinkBtn")}
      >
        <div className="py-4 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-950/50 rounded-full flex items-center justify-center text-red-600 dark:text-red-400">
            <XCircle className="w-8 h-8" />
          </div>
          <Link
            href="/forgot-password"
            className="inline-flex items-center justify-center h-10 px-6 rounded-full bg-m3-primary hover:bg-m3-primary-dark text-white font-medium text-sm transition-all"
          >
            {t("auth.forgotPassword.sendLinkBtn")}
          </Link>
        </div>
      </AuthLayout>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (password.length < 6) {
      setErrorMsg(t("auth.password.minLength"));
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg(t("auth.register.passwordMismatch"));
      return;
    }

    setIsLoading(true);
    const { error } = await authClient.resetPassword({
      newPassword: password,
      token,
    });
    setIsLoading(false);

    if (error) {
      const msg = error.message?.toLowerCase() || "";
      if (msg.includes("expir") || msg.includes("invalid")) {
        setState("expired");
      } else {
        setState("error");
        setErrorMsg(error.message || "Failed to reset password.");
      }
      return;
    }

    setState("success");
    setTimeout(() => {
      router.replace(`/login?message=${encodeURIComponent(t("auth.resetPassword.successDesc"))}`);
    }, 2500);
  };

  if (state === "success") {
    return (
      <AuthLayout
        headerTitle={t("auth.resetPassword.successTitle")}
        headerSubtitle={t("auth.resetPassword.successDesc")}
        optionalLink="/login"
        optionalMsg={t("auth.resetPassword.goToLoginBtn")}
      >
        <div className="py-4 flex flex-col items-center text-center gap-4 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/50 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <Link
            href="/login"
            className="inline-flex items-center justify-center h-10 px-6 rounded-full bg-m3-primary hover:bg-m3-primary-dark text-white font-medium text-sm transition-all"
          >
            {t("auth.resetPassword.goToLoginBtn")}
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
        optionalLink="/forgot-password"
        optionalMsg={t("auth.forgotPassword.sendLinkBtn")}
      >
        <div className="py-4 flex flex-col items-center text-center gap-4 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/50 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Clock className="w-8 h-8" />
          </div>
          <Link
            href="/forgot-password"
            className="inline-flex items-center justify-center h-10 px-6 rounded-full bg-m3-primary hover:bg-m3-primary-dark text-white font-medium text-sm transition-all"
          >
            {t("auth.forgotPassword.sendLinkBtn")}
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      headerTitle={t("auth.resetPassword.title")}
      headerSubtitle={t("auth.resetPassword.subtitle")}
      errorMsg={errorMsg}
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <GoogleTextField
          type={showPassword ? "text" : "password"}
          label={t("auth.resetPassword.newPasswordLabel")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          autoFocus
        />

        <GoogleTextField
          type={showPassword ? "text" : "password"}
          label={t("auth.resetPassword.confirmPasswordLabel")}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          error={passwordMismatch ? t("auth.register.passwordMismatch") : undefined}
        />

        <div className="flex items-center justify-between px-0.5">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              className="w-4 h-4 rounded-[4px] border-m3-border text-m3-primary focus:ring-m3-primary bg-m3-card cursor-pointer"
            />
            <span className="text-xs sm:text-sm text-m3-secondary">
              {t("auth.register.showPassword")}
            </span>
          </label>
        </div>

        {password.length > 0 && <PasswordStrengthMeter password={password} />}

        <div className="flex items-center justify-between gap-3 pt-2">
          <Link
            href="/login"
            className="text-xs sm:text-sm font-medium text-m3-primary hover:underline py-2"
          >
            {t("auth.forgotPassword.backToLogin")}
          </Link>

          <Button type="submit" isLoading={isLoading} className="rounded-full px-6">
            {t("auth.resetPassword.resetBtn")}
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}
