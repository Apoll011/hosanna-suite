"use client";

import { authClient } from "@/lib/auth-client";
import { useI18n } from "@/lib/i18n";
import { AlertTriangle, CheckCircle2, Shield } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { Button, GoogleTextField } from "@hosanna/ui";

export function TwoFactorSection({
  enabled,
  onRefresh,
  onToast,
}: {
  enabled: boolean;
  onRefresh: () => Promise<void>;
  onToast: (msg: string, type: "success" | "error") => void;
}) {
  const { t } = useI18n();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [totpURI, setTotpURI] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState("");
  const [step, setStep] = useState<"password" | "setup" | "backup" | "disable">("password");
  const [isLoading, setIsLoading] = useState(false);

  const closeModal = () => {
    setIsModalOpen(false);
    setPassword("");
    setTotpURI("");
    setBackupCodes([]);
    setVerificationCode("");
    setStep("password");
  };

  const handleEnable2FA = async () => {
    if (!password) {
      onToast(t("settings.twoFactor.passwordRequired"), "error");
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await authClient.twoFactor.enable({ password });
      if (error) {
        onToast(t("settings.twoFactor.enableError", { error: error.message || "Error" }), "error");
      } else if (data?.method === "totp" || (data as { totpURI?: string })?.totpURI) {
        setTotpURI((data as { totpURI: string }).totpURI);
        setBackupCodes((data as { backupCodes?: string[] }).backupCodes || []);
        setStep("setup");
      }
    } catch (err: unknown) {
      onToast(t("settings.twoFactor.enableError", { error: (err as Error).message || "Error" }), "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!verificationCode) {
      onToast(t("settings.twoFactor.codeRequired"), "error");
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await authClient.twoFactor.verifyTotp({
        code: verificationCode,
        trustDevice: true,
      });
      if (error) {
        onToast(error.message || t("settings.twoFactor.codeInvalid"), "error");
      } else {
        onToast(t("settings.twoFactor.codeVerified"), "success");
        setStep("backup");
      }
    } catch (err: unknown) {
      onToast(t("settings.twoFactor.verifyError", { error: (err as Error).message || "Error" }), "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishSetup = async () => {
    onToast(t("settings.twoFactor.setupSuccess"), "success");
    await onRefresh();
    closeModal();
  };

  const handleDisable2FA = async () => {
    if (!password) {
      onToast(t("settings.twoFactor.passwordRequired"), "error");
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await authClient.twoFactor.disable({ password });
      if (error) {
        onToast(t("settings.twoFactor.disableError", { error: error.message || "Error" }), "error");
      } else {
        onToast(t("settings.twoFactor.disableSuccess"), "success");
        await onRefresh();
        closeModal();
      }
    } catch (err: unknown) {
      onToast(t("settings.twoFactor.disableError", { error: (err as Error).message || "Error" }), "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-label flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-m3-primary shrink-0" />
            {t("settings.twoFactor.title")}
          </h3>
          <p className="text-xs text-m3-secondary mt-1">{t("settings.twoFactor.desc")}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setStep(enabled ? "disable" : "password");
            setIsModalOpen(true);
          }}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 ${
            enabled
              ? "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/50"
              : "bg-m3-primary text-white hover:bg-m3-primary-dark shadow-xs"
          }`}
        >
          {enabled ? t("settings.twoFactor.disableBtn") : t("settings.twoFactor.enableBtn")}
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-md rounded-2xl border border-m3-border bg-m3-card p-5 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-m3-text">
              {enabled
                ? t("settings.twoFactor.disableModalTitle")
                : t("settings.twoFactor.setupModalTitle")}
            </h2>

            {step === "password" && (
              <div className="space-y-4">
                <p className="text-xs text-m3-secondary">{t("settings.twoFactor.passwordStepDesc")}</p>
                <GoogleTextField
                  type="password"
                  label={t("settings.twoFactor.passwordLabel")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={closeModal}>
                    {t("common.cancel")}
                  </Button>
                  <Button variant="primary" size="sm" isLoading={isLoading} onClick={() => void handleEnable2FA()}>
                    {t("settings.twoFactor.continue")}
                  </Button>
                </div>
              </div>
            )}

            {step === "setup" && (
              <div className="space-y-4">
                <p className="text-xs text-m3-secondary">{t("settings.twoFactor.setupStep1")}</p>
                {totpURI && (
                  <div className="flex justify-center">
                    <div className="bg-m3-card p-3 rounded-xl shadow-sm border border-m3-border">
                      <QRCodeSVG value={totpURI} size={160} />
                    </div>
                  </div>
                )}
                <p className="text-xs text-m3-secondary">{t("settings.twoFactor.setupStep2")}</p>
                <GoogleTextField
                  type="text"
                  label={t("settings.twoFactor.verificationCodeLabel")}
                  placeholder={t("settings.twoFactor.verificationCodePlaceholder")}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={closeModal}>
                    {t("common.cancel")}
                  </Button>
                  <Button variant="primary" size="sm" isLoading={isLoading} onClick={() => void handleVerify2FA()}>
                    {t("settings.twoFactor.verify")}
                  </Button>
                </div>
              </div>
            )}

            {step === "backup" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-bold">{t("settings.twoFactor.backupSuccessTitle")}</span>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200 dark:border-amber-900/50 flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0" />
                  <p className="text-xs text-amber-800 dark:text-amber-400">
                    {t("settings.twoFactor.backupWarning")}
                  </p>
                </div>
                {backupCodes.length > 0 && (
                  <div className="bg-m3-sidebar p-4 rounded-xl border border-m3-border">
                    <div className="grid grid-cols-2 gap-2 font-mono text-sm text-m3-text text-center">
                      {backupCodes.map((code) => (
                        <span
                          key={code}
                          className="bg-m3-card py-1.5 rounded border border-m3-border shadow-sm"
                        >
                          {code}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-end">
                  <Button variant="primary" size="sm" onClick={() => void handleFinishSetup()}>
                    {t("settings.twoFactor.backupSavedBtn")}
                  </Button>
                </div>
              </div>
            )}

            {step === "disable" && (
              <div className="space-y-4">
                <p className="text-xs text-m3-secondary">{t("settings.twoFactor.disableStepDesc")}</p>
                <GoogleTextField
                  type="password"
                  label={t("settings.twoFactor.passwordLabel")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={closeModal}>
                    {t("common.cancel")}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    isLoading={isLoading}
                    onClick={() => void handleDisable2FA()}
                  >
                    {t("settings.twoFactor.disableBtn")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
