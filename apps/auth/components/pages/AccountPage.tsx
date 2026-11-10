"use client";

import { ActiveSessionsSection } from "@/components/account/ActiveSessions";
import { LoginHistorySection } from "@/components/account/LoginHistory";
import { SocialAccountsSection } from "@/components/account/SocialAccounts";
import { TwoFactorSection } from "@/components/account/TwoFactor";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/Button";
import { GoogleTextField } from "@/components/GoogleTextField";
import { Spinner } from "@/components/Spinner";
import { authClient } from "@/lib/auth-client";
import { useI18n } from "@/lib/i18n";
import { CheckCircle2, KeyRound, Lock, LogOut, PenLine, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type AuthUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  twoFactorEnabled?: boolean;
};

export function AccountPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftEmail, setDraftEmail] = useState("");
  const [draftOldPassword, setDraftOldPassword] = useState("");
  const [draftNewPassword, setDraftNewPassword] = useState("");
  const [draftConfirmPassword, setDraftConfirmPassword] = useState("");

  const showToast = useCallback((msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const refresh = useCallback(async () => {
    const session = await authClient.getSession();
    if (!session.data?.user) {
      router.replace("/login?redirect=/account");
      return;
    }
    setUser(session.data.user as AuthUser);
  }, [router]);

  useEffect(() => {
    void refresh().finally(() => setLoading(false));
  }, [refresh]);

  const handleSaveName = async () => {
    if (!draftName.trim()) {
      showToast(t("settings.account.profile.nameEmpty"), "error");
      return;
    }
    try {
      await authClient.updateUser({ name: draftName });
      await refresh();
      setIsEditingName(false);
      showToast(t("settings.account.profile.nameSaved"), "success");
    } catch {
      showToast(t("settings.account.profile.nameSaveError"), "error");
    }
  };

  const handleSaveEmail = async () => {
    if (!draftEmail.trim() || !draftEmail.includes("@")) {
      showToast(t("settings.account.profile.emailInvalid"), "error");
      return;
    }
    try {
      await authClient.changeEmail({ newEmail: draftEmail });
      await refresh();
      setIsEditingEmail(false);
      showToast(t("settings.account.profile.emailChangeSent"), "success");
    } catch (err: unknown) {
      showToast(
        t("settings.account.profile.emailChangeError", {
          error: (err as Error).message || "Error",
        }),
        "error",
      );
    }
  };

  const handleSavePassword = async () => {
    if (!draftOldPassword) {
      showToast(t("settings.account.profile.currentPasswordRequired"), "error");
      return;
    }
    if (draftNewPassword.length < 6) {
      showToast(t("settings.account.profile.passwordMinLength"), "error");
      return;
    }
    if (draftNewPassword !== draftConfirmPassword) {
      showToast(t("settings.account.profile.passwordMismatch"), "error");
      return;
    }
    try {
      await authClient.changePassword({
        newPassword: draftNewPassword,
        currentPassword: draftOldPassword,
        revokeOtherSessions: true,
      });
      showToast(t("settings.account.profile.passwordChanged"), "success");
      setIsEditingPassword(false);
      setDraftOldPassword("");
      setDraftNewPassword("");
      setDraftConfirmPassword("");
    } catch (err: unknown) {
      showToast(
        t("settings.account.profile.passwordChangeError", {
          error: (err as Error).message || "Error",
        }),
        "error",
      );
    }
  };

  const logout = async () => {
    await authClient.signOut();
    router.replace("/login");
  };

  if (loading) {
    return (
      <AuthLayout headerTitle={t("account.title")}>
        <div className="flex justify-center py-12">
          <Spinner size="md" label={t("common.loading")} />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      headerTitle={t("account.title")}
      headerSubtitle={user?.email || undefined}
      errorMsg={toast?.type === "error" ? toast.msg : undefined}
      redirectMessage={toast?.type === "success" ? toast.msg : undefined}
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-label">{t("settings.account.profile.displayName")}</label>
              {!isEditingName && (
                <button
                  type="button"
                  onClick={() => {
                    setDraftName(user?.name || "");
                    setIsEditingName(true);
                  }}
                  className="text-xs font-semibold text-m3-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <PenLine className="w-3.5 h-3.5" />
                  {t("settings.account.profile.edit")}
                </button>
              )}
            </div>
            {isEditingName ? (
              <div className="space-y-3">
                <GoogleTextField
                  label={t("settings.account.profile.displayName")}
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEditingName(false)}>
                    {t("common.cancel")}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => void handleSaveName()}
                    icon={<Save className="w-4 h-4" />}
                  >
                    {t("common.save")}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-base font-semibold text-m3-text">{user?.name || "—"}</p>
            )}
          </div>

          <div className="border-t border-m3-border pt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-label">{t("settings.account.profile.emailAddress")}</label>
              {!isEditingEmail && (
                <button
                  type="button"
                  onClick={() => {
                    setDraftEmail(user?.email || "");
                    setIsEditingEmail(true);
                  }}
                  className="text-xs font-semibold text-m3-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <PenLine className="w-3.5 h-3.5" />
                  {t("settings.account.profile.changeEmail")}
                </button>
              )}
            </div>
            {isEditingEmail ? (
              <div className="space-y-3">
                <GoogleTextField
                  type="email"
                  label={t("settings.account.profile.emailAddress")}
                  value={draftEmail}
                  onChange={(e) => setDraftEmail(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEditingEmail(false)}>
                    {t("common.cancel")}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => void handleSaveEmail()}
                    icon={<Save className="w-4 h-4" />}
                  >
                    {t("settings.account.profile.saveEmail")}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-base font-semibold text-m3-text flex items-center gap-2">
                {user?.email || "—"}
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </p>
            )}
          </div>

          <div className="border-t border-m3-border pt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-label flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-m3-primary" />
                {t("settings.account.profile.password")}
              </label>
              {!isEditingPassword && (
                <button
                  type="button"
                  onClick={() => setIsEditingPassword(true)}
                  className="text-xs font-semibold text-m3-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  {t("settings.account.profile.changePassword")}
                </button>
              )}
            </div>
            {isEditingPassword ? (
              <div className="space-y-3">
                <GoogleTextField
                  type="password"
                  label={t("settings.account.profile.currentPassword")}
                  value={draftOldPassword}
                  onChange={(e) => setDraftOldPassword(e.target.value)}
                />
                <GoogleTextField
                  type="password"
                  label={t("settings.account.profile.newPassword")}
                  value={draftNewPassword}
                  onChange={(e) => setDraftNewPassword(e.target.value)}
                />
                <GoogleTextField
                  type="password"
                  label={t("settings.account.profile.confirmNewPassword")}
                  value={draftConfirmPassword}
                  onChange={(e) => setDraftConfirmPassword(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditingPassword(false);
                      setDraftOldPassword("");
                      setDraftNewPassword("");
                      setDraftConfirmPassword("");
                    }}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => void handleSavePassword()}
                    icon={<Save className="w-4 h-4" />}
                  >
                    {t("settings.account.profile.updatePassword")}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-base font-semibold text-m3-text">••••••••••••</p>
            )}
          </div>

          <div className="border-t border-m3-border pt-4">
            <TwoFactorSection
              enabled={Boolean(user?.twoFactorEnabled)}
              onRefresh={refresh}
              onToast={showToast}
            />
          </div>
        </div>

        <SocialAccountsSection onToast={showToast} />

        <div className="grid grid-cols-1 gap-6">
          <ActiveSessionsSection onToast={showToast} />
          <LoginHistorySection />
        </div>

        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex items-center text-xs sm:text-sm font-medium text-m3-secondary hover:text-m3-text transition-colors gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t("account.signOut")}</span>
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}
