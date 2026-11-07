/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppLink } from "@/src/components/AppLink";
import { Button } from "@/src/components/common";
import { useAppNavigate } from "@/src/hooks/useAppNavigate";
import { useI18n } from "@/src/lib/i18n";
import { CheckCircle2, Mail, ShieldCheck } from "lucide-react";
import React, { useRef, useState } from "react";
import { authClient } from "../../lib/authClient";
import LoginLayout from "./Layout";
import { GoogleTextField } from "./components/GoogleTextField";
import {
  TurnstileWidget,
  type TurnstileHandle,
} from "./components/TurnstileWidget";

export const ForgotPasswordPage: React.FC = () => {
  const { navigate } = useAppNavigate();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<"link" | "code">("link");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [sent, setSent] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const captchaRef = useRef<TurnstileHandle>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg(t("settings.account.profile.emailInvalid"));
      return;
    }
    setErrorMsg("");
    setIsLoading(true);

    if (mode === "code") {
      const { error } = await authClient.sendVerificationEmail({
        email: email.trim(),
        callbackURL: `${window.location.origin}/reset-password`,
        fetchOptions: captchaToken
          ? {
              headers: { "x-captcha-response": captchaToken },
            }
          : undefined,
      });
      setIsLoading(false);
      captchaRef.current?.reset();
      setCaptchaToken("");
      if (error) {
        setErrorMsg(error.message || "Erro ao enviar código de recuperação.");
        return;
      }

      navigate("/reset-password", {
        state: { email: email.trim(), mode: "code" },
      });
      return;
    }

    const { error } = await authClient.requestPasswordReset({
      email: email.trim(),
      redirectTo: `${window.location.origin}/reset-password`,
      fetchOptions: captchaToken
        ? {
            headers: { "x-captcha-response": captchaToken },
          }
        : undefined,
    });
    setIsLoading(false);
    captchaRef.current?.reset();
    setCaptchaToken("");
    if (error) {
      setErrorMsg(error.message || "Erro ao enviar e-mail.");
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <LoginLayout
        headerTitle={t("auth.forgotPassword.emailSentTitle")}
        headerSubtitle={t("auth.forgotPassword.emailSentDesc")}
        optionalLink="/login"
        optionalMsg={t("auth.forgotPassword.backToLogin")}
      >
        <div className="py-4 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/50 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <AppLink
            to="/login"
            className="inline-flex items-center justify-center h-10 px-6 rounded-full bg-m3-primary hover:bg-m3-primary-dark text-white font-medium text-sm transition-all"
          >
            {t("auth.forgotPassword.backToLogin")}
          </AppLink>
        </div>
      </LoginLayout>
    );
  }

  return (
    <LoginLayout
      headerTitle={t("auth.forgotPassword.title")}
      headerSubtitle={t("auth.forgotPassword.subtitle")}
      errorMsg={errorMsg}
    >
      {/* Mode switcher tabs styled like Google material chips */}
      <div className="flex rounded-[var(--radius-md)] bg-m3-sidebar/80 p-1 mb-5 border border-m3-border/60">
        <button
          type="button"
          onClick={() => setMode("link")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-[var(--radius-sm)] text-xs sm:text-sm font-medium transition-all cursor-pointer ${
            mode === "link"
              ? "bg-m3-card text-m3-primary shadow-xs"
              : "text-m3-secondary hover:text-m3-text"
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Email link</span>
        </button>
        <button
          type="button"
          onClick={() => setMode("code")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-[var(--radius-sm)] text-xs sm:text-sm font-medium transition-all cursor-pointer ${
            mode === "code"
              ? "bg-m3-card text-m3-primary shadow-xs"
              : "text-m3-secondary hover:text-m3-text"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Código OTP</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <GoogleTextField
          type="email"
          label={t("auth.forgotPassword.emailLabel")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          autoFocus
        />

        <TurnstileWidget ref={captchaRef} onVerify={setCaptchaToken} />

        <div className="flex items-center justify-between gap-3 pt-2">
          <AppLink
            to="/login"
            className="text-xs sm:text-sm font-medium text-m3-primary hover:text-m3-primary-dark hover:underline py-2"
          >
            {t("auth.forgotPassword.backToLogin")}
          </AppLink>

          <Button
            type="submit"
            isLoading={isLoading}
            className="rounded-full px-6"
          >
            {t("auth.forgotPassword.sendLinkBtn")}
          </Button>
        </div>
      </form>
    </LoginLayout>
  );
};
