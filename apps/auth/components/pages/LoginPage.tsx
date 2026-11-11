"use client";

import { AuthLayout } from "@/components/AuthLayout";
import { SocialAuthButtons } from "@/components/SocialAuthButtons";
import { TurnstileWidget, type TurnstileHandle } from "@/components/TurnstileWidget";
import { authClient } from "@/lib/auth/client";
import { captchaFetchOptions, captchaRequired } from "@/lib/auth/captcha";
import { useI18n } from "@/lib/ui/i18n";
import { redirectAfterSuccessfulAuth } from "@/lib/auth/redirect";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { Button, GoogleTextField } from "@hosanna/ui";

export function LoginPage() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const redirectMessage = searchParams.get("message") || "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const captchaRef = useRef<TurnstileHandle>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg(t("auth.login.errorInvalidCredentials"));
      return;
    }
    if (captchaRequired() && !captchaToken) {
      setErrorMsg(t("auth.captcha.pending"));
      captchaRef.current?.show();
      return;
    }
    setErrorMsg("");
    setIsLoading(true);

    const { data, error } = await authClient.signIn.email({
      email: email.trim(),
      password,
      rememberMe,
      fetchOptions: captchaFetchOptions(captchaToken),
    });

    setIsLoading(false);
    captchaRef.current?.reset();
    setCaptchaToken("");

    if (error) {
      if (error.code === "TWO_FACTOR_REQUIRED" || (error as { status?: number })?.status === 403) {
        window.location.assign("/two-factor");
        return;
      }
      setErrorMsg(error.message || t("auth.login.errorInvalidCredentials"));
      return;
    }

    if ((data as { twoFactorRedirect?: boolean })?.twoFactorRedirect) {
      window.location.assign("/two-factor");
      return;
    }

    await redirectAfterSuccessfulAuth(searchParams);
  };

  return (
    <AuthLayout
      headerTitle={t("auth.login.title")}
      headerSubtitle={t("auth.login.subtitle")}
      errorMsg={errorMsg}
      redirectMessage={redirectMessage}
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
        <GoogleTextField
          type="email"
          label={t("auth.login.emailLabel")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          autoFocus
        />

        <div className="space-y-2">
          <GoogleTextField
            type={showPassword ? "text" : "password"}
            label={t("auth.login.passwordLabel")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            trailingIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1.5 rounded-full text-m3-secondary hover:text-m3-text transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            }
          />

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded-sm border-m3-border text-m3-primary focus:ring-m3-primary bg-m3-card cursor-pointer"
              />
              <span className="text-xs sm:text-sm text-m3-secondary">
                {t("auth.login.rememberMe")}
              </span>
            </label>

            <Link
              href="/forgot-password"
              className="text-xs sm:text-sm font-medium text-m3-primary hover:text-m3-primary-dark hover:underline"
            >
              {t("auth.login.forgotPasswordLink")}
            </Link>
          </div>
        </div>

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
            href="/register"
            className="text-xs sm:text-sm font-medium text-m3-primary hover:text-m3-primary-dark hover:underline py-2"
          >
            {t("auth.login.registerLink")}
          </Link>

          <Button type="submit" size="md" isLoading={isLoading} className="rounded-full">
            {t("auth.login.loginBtn")}
          </Button>
        </div>
      </form>

      <SocialAuthButtons onError={(err) => setErrorMsg(err)} disabled={isLoading} />
    </AuthLayout>
  );
}
