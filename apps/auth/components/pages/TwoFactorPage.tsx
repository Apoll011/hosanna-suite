"use client";

import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/Button";
import { GoogleTextField } from "@/components/GoogleTextField";
import { authClient } from "@/lib/auth-client";
import { useLocale } from "@/lib/locale";
import { redirectAfterSuccessfulAuth } from "@/lib/redirect";
import { KeyRound, MailCheck, RefreshCw, Smartphone } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRef, useState, type FormEvent, type KeyboardEvent, type ChangeEvent, type ClipboardEvent } from "react";

type TwoFactorMethod = "totp" | "otp" | "backup";

export function TwoFactorPage() {
  const searchParams = useSearchParams();
  const { t } = useLocale();

  const [method, setMethod] = useState<TwoFactorMethod>("totp");
  const [code, setCode] = useState("");
  const [backupCode, setBackupCode] = useState("");
  const [trustDevice, setTrustDevice] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSentMsg, setOtpSentMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSendOtp = async () => {
    setErrorMsg("");
    setOtpSentMsg("");
    setIsSendingOtp(true);
    const { error } = await authClient.twoFactor.sendOtp({});
    setIsSendingOtp(false);
    if (error) {
      setErrorMsg(error.message || "Failed to send OTP email.");
      return;
    }
    setOtpSentMsg("A new code was sent to your email.");
  };

  const handleSwitchMethod = (newMethod: TwoFactorMethod) => {
    setMethod(newMethod);
    setCode("");
    setBackupCode("");
    setErrorMsg("");
    setOtpSentMsg("");
    if (newMethod === "otp") {
      void handleSendOtp();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (method === "backup") {
      if (!backupCode.trim()) {
        setErrorMsg(t("settings.twoFactor.codeRequired"));
        return;
      }
      setIsLoading(true);
      const { error } = await authClient.twoFactor.verifyBackupCode({
        code: backupCode.trim(),
        trustDevice,
      });
      setIsLoading(false);
      if (error) {
        setErrorMsg(error.message || t("settings.twoFactor.codeInvalid"));
        return;
      }
    } else if (method === "otp") {
      if (!code.trim() || code.trim().length < 6) {
        setErrorMsg(t("settings.twoFactor.codeRequired"));
        return;
      }
      setIsLoading(true);
      const { error } = await authClient.twoFactor.verifyOtp({
        code: code.trim(),
        trustDevice,
      });
      setIsLoading(false);
      if (error) {
        setErrorMsg(error.message || t("settings.twoFactor.codeInvalid"));
        return;
      }
    } else {
      if (!code.trim() || code.trim().length < 6) {
        setErrorMsg(t("settings.twoFactor.codeRequired"));
        return;
      }
      setIsLoading(true);
      const { error } = await authClient.twoFactor.verifyTotp({
        code: code.trim(),
        trustDevice,
      });
      setIsLoading(false);
      if (error) {
        setErrorMsg(error.message || t("settings.twoFactor.codeInvalid"));
        return;
      }
    }

    await redirectAfterSuccessfulAuth(searchParams);
  };

  const getSubtitle = () => {
    if (method === "totp") return t("auth.twoFactor.subtitle");
    if (method === "otp") return "Enter the code sent to your email";
    return t("auth.twoFactor.useBackupCode");
  };

  return (
    <AuthLayout
      headerTitle={t("auth.twoFactor.title")}
      headerSubtitle={getSubtitle()}
      errorMsg={errorMsg}
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
        <div className="flex rounded-md bg-m3-sidebar/80 p-1 border border-m3-border/60">
          {(
            [
              ["totp", Smartphone, "App"],
              ["otp", MailCheck, "Email"],
              ["backup", KeyRound, t("auth.twoFactor.backupCodeLabel")],
            ] as const
          ).map(([id, Icon, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => handleSwitchMethod(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-sm text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                method === id
                  ? "bg-m3-card text-m3-primary shadow-xs"
                  : "text-m3-secondary hover:text-m3-text"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {otpSentMsg && method === "otp" && (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-medium text-center border border-emerald-200 dark:border-emerald-800/60 animate-in fade-in">
            {otpSentMsg}
          </div>
        )}

        {method === "backup" ? (
          <GoogleTextField
            label={t("auth.twoFactor.backupCodeLabel")}
            placeholder={t("auth.twoFactor.backupCodePlaceholder")}
            value={backupCode}
            onChange={(e) => setBackupCode(e.target.value.trim())}
            autoFocus
          />
        ) : (
          <OtpInput value={code} onChange={setCode} />
        )}

        {method === "otp" && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => void handleSendOtp()}
              disabled={isSendingOtp}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-m3-primary hover:text-m3-primary-dark hover:underline disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSendingOtp ? "animate-spin" : ""}`} />
              <span>Resend email code</span>
            </button>
          </div>
        )}

        <div className="flex items-center justify-start pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs sm:text-sm text-m3-secondary">
            <input
              type="checkbox"
              checked={trustDevice}
              onChange={(e) => setTrustDevice(e.target.checked)}
              className="w-4 h-4 rounded-sm border-m3-border text-m3-primary focus:ring-m3-primary bg-m3-card cursor-pointer"
            />
            <span>{t("auth.login.rememberMe")}</span>
          </label>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          <Link
            href="/login"
            className="text-xs sm:text-sm font-medium text-m3-primary hover:text-m3-primary-dark hover:underline py-2"
          >
            {t("auth.forgotPassword.backToLogin")}
          </Link>

          <Button type="submit" isLoading={isLoading} className="rounded-full px-6">
            {t("auth.twoFactor.verifyBtn")}
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}

function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const length = 6;
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(length, "").split("").slice(0, length);

  const handleKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const currentDigits = [...digits];
      if (currentDigits[i]) {
        currentDigits[i] = "";
        onChange(currentDigits.join("").trimEnd());
      } else if (i > 0) {
        currentDigits[i - 1] = "";
        onChange(currentDigits.join("").trimEnd());
        inputRefs.current[i - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      inputRefs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < length - 1) {
      inputRefs.current[i + 1]?.focus();
    }
  };

  const handleChange = (i: number, e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) {
      const nextDigits = [...digits];
      nextDigits[i] = "";
      onChange(nextDigits.join(""));
      return;
    }
    const char = raw.slice(-1);
    const nextDigits = [...digits];
    nextDigits[i] = char;
    onChange(nextDigits.join(""));
    if (i < length - 1) inputRefs.current[i + 1]?.focus();
  };

  const handlePaste = (e: ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    onChange(pasted);
    inputRefs.current[Math.min(pasted.length, length - 1)]?.focus();
  };

  return (
    <div className="flex gap-2 sm:gap-3 justify-center my-2" onPaste={handlePaste}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digits[i] && digits[i] !== " " ? digits[i] : ""}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKey(i, e)}
          onFocus={(e) => e.target.select()}
          className="w-10 sm:w-12 h-12 sm:h-14 text-center text-lg sm:text-xl font-medium rounded-md border border-m3-border bg-transparent text-m3-text focus:border-m3-primary focus:ring-2 focus:ring-m3-primary/25 focus:outline-none transition-all"
        />
      ))}
    </div>
  );
}
