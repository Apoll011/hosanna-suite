import { Button, Input, Modal } from "@/src/components/common";
import { useAuth } from "@/src/contexts/AuthContext";
import { useSync } from "@/src/contexts/SyncContext";
import { authClient } from "@/src/lib/authClient";
import { useI18n } from "@/src/lib/i18n";
import { AlertTriangle, CheckCircle2, Shield } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import React, { useState } from "react";

export const TwoFactorSection: React.FC = () => {
  const { user, refetch: refetchAuth } = useAuth();
  const { showToast } = useSync();
  const { t } = useI18n();
  const is2FAEnabled =
    (user as { twoFactorEnabled?: boolean })?.twoFactorEnabled || false;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [totpURI, setTotpURI] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState("");

  const [step, setStep] = useState<"password" | "setup" | "backup" | "disable">(
    "password",
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleEnable2FA = async () => {
    if (!password) {
      showToast(t("settings.twoFactor.passwordRequired"), "error");
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await authClient.twoFactor.enable({ password });
      if (error) {
        showToast(
          t("settings.twoFactor.enableError", {
            error: error.message || "Erro",
          }),
          "error",
        );
      } else if (data?.method === "totp") {
        setTotpURI((data as { totpURI: string }).totpURI);
        setBackupCodes((data as { backupCodes?: string[] }).backupCodes || []);
        setStep("setup");
      }
    } catch (err: unknown) {
      showToast(
        t("settings.twoFactor.enableError", {
          error: (err as Error).message || "Erro",
        }),
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!verificationCode) {
      showToast(t("settings.twoFactor.codeRequired"), "error");
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await authClient.twoFactor.verifyTotp({
        code: verificationCode,
        trustDevice: true,
      });
      if (error) {
        showToast(
          error.message || t("settings.twoFactor.codeInvalid"),
          "error",
        );
      } else {
        showToast(t("settings.twoFactor.codeVerified"), "success");
        setStep("backup");
      }
    } catch (err: unknown) {
      showToast(
        t("settings.twoFactor.verifyError", {
          error: (err as Error).message || "Erro",
        }),
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishSetup = async () => {
    showToast(t("settings.twoFactor.setupSuccess"), "success");
    await refetchAuth();
    closeModal();
  };

  const handleDisable2FA = async () => {
    if (!password) {
      showToast(t("settings.twoFactor.passwordRequired"), "error");
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await authClient.twoFactor.disable({ password });
      if (error) {
        showToast(
          t("settings.twoFactor.disableError", {
            error: error.message || "Erro",
          }),
          "error",
        );
      } else {
        showToast(t("settings.twoFactor.disableSuccess"), "success");
        await refetchAuth();
        closeModal();
      }
    } catch (err: unknown) {
      showToast(
        t("settings.twoFactor.disableError", {
          error: (err as Error).message || "Erro",
        }),
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setPassword("");
    setTotpURI("");
    setBackupCodes([]);
    setVerificationCode("");
    setStep("password");
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-m3-primary" />
            {t("settings.twoFactor.title")}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t("settings.twoFactor.desc")}
          </p>
        </div>
        <button
          onClick={() => {
            setStep(is2FAEnabled ? "disable" : "password");
            setIsModalOpen(true);
          }}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            is2FAEnabled
              ? "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/50"
              : "bg-m3-primary text-white hover:bg-m3-primary-dark shadow-xs"
          }`}
        >
          {is2FAEnabled
            ? t("settings.twoFactor.disableBtn")
            : t("settings.twoFactor.enableBtn")}
        </button>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={
          is2FAEnabled
            ? t("settings.twoFactor.disableModalTitle")
            : t("settings.twoFactor.setupModalTitle")
        }
      >
        <div className="space-y-4 py-2">
          {/* PASSO 1: CONFIRMAR PALAVRA-PASSE */}
          {step === "password" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                {t("settings.twoFactor.passwordStepDesc")}
              </p>
              <Input
                type="password"
                label={t("settings.twoFactor.passwordLabel")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" size="sm" onClick={closeModal}>
                  {t("common.cancel")}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={isLoading}
                  onClick={handleEnable2FA}
                >
                  {t("settings.twoFactor.continue")}
                </Button>
              </div>
            </div>
          )}

          {/* PASSO 2: CONFIGURAR CÓDIGO QR */}
          {step === "setup" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                {t("settings.twoFactor.setupStep1")}
              </p>

              {totpURI && (
                <div className="flex justify-center mb-6">
                  <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200">
                    <QRCodeSVG value={totpURI} size={160} />
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                {t("settings.twoFactor.setupStep2")}
              </p>

              <Input
                type="text"
                label={t("settings.twoFactor.verificationCodeLabel")}
                placeholder={t(
                  "settings.twoFactor.verificationCodePlaceholder",
                )}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" size="sm" onClick={closeModal}>
                  {t("common.cancel")}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={isLoading}
                  onClick={handleVerify2FA}
                >
                  {t("settings.twoFactor.verify")}
                </Button>
              </div>
            </div>
          )}

          {/* PASSO 3: CÓDIGOS DE RECUPERAÇÃO */}
          {step === "backup" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-2 mb-3 text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-bold">
                  {t("settings.twoFactor.backupSuccessTitle")}
                </span>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200 dark:border-amber-900/50 mb-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0" />
                <p className="text-xs text-amber-800 dark:text-amber-400">
                  {t("settings.twoFactor.backupWarning")}
                </p>
              </div>

              {backupCodes.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="grid grid-cols-2 gap-2 font-mono text-sm text-slate-700 dark:text-slate-300 text-center">
                    {backupCodes.map((code, idx) => (
                      <span
                        key={idx}
                        className="bg-white dark:bg-slate-900 py-1.5 rounded border border-slate-200 dark:border-slate-800 shadow-sm"
                      >
                        {code}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-6">
                <Button variant="primary" size="sm" onClick={handleFinishSetup}>
                  {t("settings.twoFactor.backupSavedBtn")}
                </Button>
              </div>
            </div>
          )}

          {/* PASSO DESATIVAR */}
          {step === "disable" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                {t("settings.twoFactor.disableStepDesc")}
              </p>
              <Input
                type="password"
                label={t("settings.twoFactor.passwordLabel")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" size="sm" onClick={closeModal}>
                  {t("common.cancel")}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={isLoading}
                  onClick={handleDisable2FA}
                  className="bg-red-600 hover:bg-red-700 text-white border-0"
                >
                  {t("settings.twoFactor.disableBtn")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
