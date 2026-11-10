"use client";

import { AuthLayout } from "@/components/AuthLayout";
import { PasswordStrengthMeter } from "@/components/PasswordStrengthMeter";
import { SocialAuthButtons } from "@/components/SocialAuthButtons";
import { TurnstileWidget, type TurnstileHandle } from "@/components/TurnstileWidget";
import { authClient } from "@/lib/auth-client";
import { captchaFetchOptions, captchaRequired } from "@/lib/captcha";
import { useI18n } from "@/lib/i18n";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { Button, GoogleTextField } from "@hosanna/ui";

export function RegisterPage() {
  const { t } = useI18n();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const captchaRef = useRef<TurnstileHandle>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successState, setSuccessState] = useState(false);

  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMsg("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg(t("auth.register.passwordMismatch"));
      return;
    }
    if (password.length < 6) {
      setErrorMsg(t("auth.password.minLength"));
      return;
    }
    if (captchaRequired() && !captchaToken) {
      setErrorMsg(t("auth.captcha.pending"));
      captchaRef.current?.show();
      return;
    }

    setIsLoading(true);

    const { error } = await authClient.signUp.email({
      name: name.trim(),
      email: email.trim(),
      password,
      fetchOptions: captchaFetchOptions(captchaToken),
    });
    setIsLoading(false);

    captchaRef.current?.reset();
    setCaptchaToken("");

    if (error) {
      setErrorMsg(error.message || "Registration failed.");
      return;
    }

    setSuccessState(true);
  };

  if (successState) {
    return (
      <AuthLayout
        headerTitle={t("auth.register.successTitle")}
        headerSubtitle={t("auth.register.successDesc")}
        optionalLink="/login"
        optionalMsg={t("auth.register.loginLink")}
      >
        <div className="py-4 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 mb-4 flex items-center justify-center bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-full">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <Link
            href="/login"
            className="inline-flex items-center justify-center h-10 px-6 rounded-full bg-m3-primary hover:bg-m3-primary-dark text-white font-medium text-sm transition-all"
          >
            {t("auth.register.loginLink")}
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      headerTitle={t("auth.register.title")}
      headerSubtitle={t("auth.register.subtitle")}
      errorMsg={errorMsg}
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
        <GoogleTextField
          label={t("auth.register.nameLabel")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          autoFocus
        />

        <GoogleTextField
          type="email"
          label={t("auth.register.emailLabel")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <GoogleTextField
            type={showPassword ? "text" : "password"}
            label={t("auth.register.passwordLabel")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />

          <GoogleTextField
            type={showPassword ? "text" : "password"}
            label={t("auth.register.confirmPasswordLabel")}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            error={passwordMismatch ? t("auth.register.passwordMismatch") : undefined}
          />
        </div>

        <div className="flex items-center justify-between px-0.5">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              className="w-4 h-4 rounded-sm border-m3-border text-m3-primary focus:ring-m3-primary bg-m3-card cursor-pointer"
            />
            <span className="text-xs sm:text-sm text-m3-secondary">
              {t("auth.register.showPassword")}
            </span>
          </label>
        </div>

        {password.length > 0 && <PasswordStrengthMeter password={password} />}

        <TurnstileWidget
          ref={captchaRef}
          onVerify={(token) => {
            setCaptchaToken(token);
            setErrorMsg((msg) => (msg === t("auth.captcha.pending") ? "" : msg));
          }}
          onExpire={() => setCaptchaToken("")}
          onError={() => setErrorMsg(t("auth.captcha.failed"))}
        />

        <div className="flex items-center justify-between gap-3 pt-2">
          <Link
            href="/login"
            className="text-xs sm:text-sm font-medium text-m3-primary hover:text-m3-primary-dark hover:underline py-2"
          >
            {t("auth.register.loginLink")}
          </Link>

          <Button type="submit" size="lg" isLoading={isLoading} className="rounded-full">
            {t("auth.register.registerBtn")}
          </Button>
        </div>
      </form>

      <SocialAuthButtons onError={(err) => setErrorMsg(err)} disabled={isLoading} />
    </AuthLayout>
  );
}
