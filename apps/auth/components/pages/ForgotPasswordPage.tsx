"use client";

import { AuthLayout } from "@/components/AuthLayout";
import { TurnstileWidget, type TurnstileHandle } from "@/components/TurnstileWidget";
import { authClient } from "@/lib/auth-client";
import { captchaFetchOptions } from "@/lib/captcha";
import { useI18n } from "@/lib/i18n";
import { CheckCircle2, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { Button, GoogleTextField } from "@hosanna/ui";

export function ForgotPasswordPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<"link" | "code">("link");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [sent, setSent] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const captchaRef = useRef<TurnstileHandle>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg(t("auth.email.invalid"));
      return;
    }
    setErrorMsg("");
    setIsLoading(true);

    if (mode === "code") {
      const { error } = await authClient.sendVerificationEmail({
        email: email.trim(),
        callbackURL: `${window.location.origin}/reset-password`,
        fetchOptions: captchaFetchOptions(captchaToken),
      });
      setIsLoading(false);
      captchaRef.current?.reset();
      setCaptchaToken("");
      if (error) {
        setErrorMsg(error.message || "Failed to send recovery code.");
        return;
      }
      router.push(`/reset-password?email=${encodeURIComponent(email.trim())}&mode=code`);
      return;
    }

    const { error } = await authClient.requestPasswordReset({
      email: email.trim(),
      redirectTo: `${window.location.origin}/reset-password`,
      fetchOptions: captchaFetchOptions(captchaToken),
    });
    setIsLoading(false);
    captchaRef.current?.reset();
    setCaptchaToken("");
    if (error) {
      setErrorMsg(error.message || "Failed to send email.");
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <AuthLayout
        headerTitle={t("auth.forgotPassword.emailSentTitle")}
        headerSubtitle={t("auth.forgotPassword.emailSentDesc")}
        optionalLink="/login"
        optionalMsg={t("auth.forgotPassword.backToLogin")}
      >
        <div className="py-4 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/50 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <Link
            href="/login"
            className="inline-flex items-center justify-center h-10 px-6 rounded-full bg-m3-primary hover:bg-m3-primary-dark text-white font-medium text-sm transition-all"
          >
            {t("auth.forgotPassword.backToLogin")}
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      headerTitle={t("auth.forgotPassword.title")}
      headerSubtitle={t("auth.forgotPassword.subtitle")}
      errorMsg={errorMsg}
    >
      <div className="flex rounded-md bg-m3-sidebar/80 p-1 mb-5 border border-m3-border/60">
        <button
          type="button"
          onClick={() => setMode("link")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-sm text-xs sm:text-sm font-medium transition-all cursor-pointer ${
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
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-sm text-xs sm:text-sm font-medium transition-all cursor-pointer ${
            mode === "code"
              ? "bg-m3-card text-m3-primary shadow-xs"
              : "text-m3-secondary hover:text-m3-text"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>OTP</span>
        </button>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
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
          <Link
            href="/login"
            className="text-xs sm:text-sm font-medium text-m3-primary hover:text-m3-primary-dark hover:underline py-2"
          >
            {t("auth.forgotPassword.backToLogin")}
          </Link>

          <Button type="submit" size="lg" isLoading={isLoading} className="rounded-full">
            {t("auth.forgotPassword.sendLinkBtn")}
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}
