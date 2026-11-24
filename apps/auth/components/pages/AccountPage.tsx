// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { AccountCenter } from "@/components/account/AccountCenter";
import { ActiveSessionsSection } from "@/components/account/ActiveSessions";
import { LanguagePreferencesSection } from "@/components/account/LanguagePreferences";
import { LoginHistorySection } from "@/components/account/LoginHistory";
import { NotificationSettingsSection } from "@/components/account/NotificationSettings";
import { SocialAccountsSection } from "@/components/account/SocialAccounts";
import { TwoFactorSection } from "@/components/account/TwoFactor";
import { useAuthUser } from "@/hooks/useAuthUser";
import { authClient } from "@/lib/auth/client";
import { compressImage } from "@/lib/account/compress-image";
import { useI18n } from "@/lib/ui/i18n";
import { clearCachedOrg } from "@/lib/organization/cache";
import { clearCachedUser, writeCachedUser, toCachedUser } from "@/lib/session/cache";
import { Button, GoogleTextField, Modal, PageHeader, Spinner, Surface } from "@hosanna/ui";
import type { CachedAuthUser } from "@/lib/session/cache";
import Link from "next/link";
import {
  Camera,
  CheckCircle2,
  Info,
  KeyRound,
  Lock,
  LogOut,
  PenLine,
  Save,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

function initials(name?: string | null) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function AccountPage({ initialUser = null }: { initialUser?: CachedAuthUser | null }) {
  const { t } = useI18n();
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const { user, setUser, isLoading, refresh, clear } = useAuthUser({ initialUser });

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [isCompressingAvatar, setIsCompressingAvatar] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftEmail, setDraftEmail] = useState("");
  const [draftOldPassword, setDraftOldPassword] = useState("");
  const [draftNewPassword, setDraftNewPassword] = useState("");
  const [draftConfirmPassword, setDraftConfirmPassword] = useState("");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteChecking, setDeleteChecking] = useState(false);
  const [soleOwnerOrgs, setSoleOwnerOrgs] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [deleteOtpSent, setDeleteOtpSent] = useState(false);
  const [deleteOtpSending, setDeleteOtpSending] = useState(false);
  const [deleteOtp, setDeleteOtp] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  const showToast = useCallback((msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3500);
  }, []);

  const syncUser = useCallback(async () => {
    await refresh();
  }, [refresh]);

  const patchUser = useCallback(
    (patch: Partial<NonNullable<typeof user>>) => {
      setUser((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...patch };
        writeCachedUser(toCachedUser(next));
        return next;
      });
    },
    [setUser],
  );

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast(t("settings.account.profile.invalidImage"), "error");
      return;
    }
    try {
      setIsCompressingAvatar(true);
      const compressed = await compressImage(file, 800, 0.8);
      patchUser({ image: compressed });
      await authClient.updateUser({ image: compressed });
      await syncUser();
      showToast(t("settings.account.profile.avatarUpdated"), "success");
    } catch (err: unknown) {
      showToast(
        t("settings.account.profile.avatarUpdateError", {
          error: (err as Error).message || "Error",
        }),
        "error",
      );
    } finally {
      setIsCompressingAvatar(false);
      e.target.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      patchUser({ image: null });
      await authClient.updateUser({ image: "" });
      await syncUser();
      showToast(t("settings.account.profile.avatarRemoved"), "success");
    } catch {
      showToast(t("settings.account.profile.avatarRemoveError"), "error");
    }
  };

  const handleSaveName = async () => {
    if (!draftName.trim()) {
      showToast(t("settings.account.profile.nameEmpty"), "error");
      return;
    }
    try {
      await authClient.updateUser({ name: draftName });
      patchUser({ name: draftName.trim() });
      setIsEditingName(false);
      await syncUser();
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
      setIsEditingEmail(false);
      await syncUser();
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
    clear();
    clearCachedUser();
    clearCachedOrg();
    await authClient.signOut();
    router.replace("/login");
  };

  const openDeleteModal = async () => {
    setDeleteOpen(true);
    setDeleteChecking(true);
    setSoleOwnerOrgs([]);
    setDeleteOtpSent(false);
    setDeleteOtp("");
    try {
      const res = await fetch("/api/erasure/account");
      if (res.ok) {
        const json = (await res.json()) as {
          soleOwnerOrgs?: Array<{ id: string; name: string; slug: string }>;
        };
        setSoleOwnerOrgs(json.soleOwnerOrgs ?? []);
      }
    } catch {
      // Server POST still enforces sole-owner check.
    } finally {
      setDeleteChecking(false);
    }
  };

  const sendDeleteOtp = async () => {
    setDeleteOtpSending(true);
    try {
      const res = await fetch("/api/erasure/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "account" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to send verification code");
      }
      setDeleteOtpSent(true);
    } catch (err) {
      showToast(
        t("account.danger.deleteError", { error: (err as Error)?.message || "" }),
        "error",
      );
    } finally {
      setDeleteOtpSending(false);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    if (!deleteOtp.trim()) return;
    setDeletingAccount(true);
    try {
      const res = await fetch("/api/erasure/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: deleteOtp.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 409 && json.blocked && Array.isArray(json.orgs)) {
        setSoleOwnerOrgs(json.orgs);
        return;
      }
      if (!res.ok) {
        throw new Error(json.error || "Delete failed");
      }
      clear();
      clearCachedUser();
      clearCachedOrg();
      showToast(t("account.danger.deleteSuccess"), "success");
      window.location.assign("/login?deleted=1");
    } catch (err) {
      showToast(
        t("account.danger.deleteError", { error: (err as Error)?.message || "" }),
        "error",
      );
    } finally {
      setDeletingAccount(false);
    }
  };

  if (isLoading && !user) {
    return (
      <AccountCenter>
        <div className="flex justify-center py-16">
          <Spinner size="md" label={t("common.loading")} />
        </div>
      </AccountCenter>
    );
  }

  if (!user) return null;

  return (
    <AccountCenter toast={toast}>
      <PageHeader
        title={t("account.title")}
        description={t("account.subtitle")}
        actions={
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-m3-secondary hover:text-m3-text transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t("account.signOut")}</span>
          </button>
        }
      />

      <div className="space-y-6 pb-8">
        <Surface>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-linear-to-tr from-sky-600 to-cyan-500 flex items-center justify-center font-semibold text-white text-xl overflow-hidden shadow-sm">
                  {user.image ? (
                    <img src={user.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>{initials(user.name)}</span>
                  )}
                </div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => void handleAvatarChange(e)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isCompressingAvatar}
                  className="absolute bottom-0 right-0 p-1.5 bg-m3-primary text-white rounded-full shadow-sm hover:bg-m3-primary-dark transition-colors cursor-pointer disabled:opacity-50"
                  title={t("settings.account.profile.changeAvatarTitle")}
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="min-w-0">
                <h2 className="text-title text-m3-text truncate">
                  {user.name || t("settings.account.user")}
                </h2>
                <p className="text-caption mt-0.5 truncate">{user.email}</p>
              </div>
            </div>
            {user.image ? (
              <button
                type="button"
                onClick={() => void handleRemoveAvatar()}
                className="text-xs font-semibold text-m3-danger hover:opacity-80 flex items-center gap-1 self-start sm:self-center cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t("settings.account.profile.removeAvatar")}
              </button>
            ) : null}
          </div>
        </Surface>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:items-stretch">
          <div className="flex flex-col gap-6 min-w-0">
            <Surface>
              <div className="flex items-center justify-between mb-2">
                <span className="text-label">{t("settings.account.profile.displayName")}</span>
                {!isEditingName ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDraftName(user.name || "");
                      setIsEditingName(true);
                    }}
                    className="text-xs font-semibold text-m3-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <PenLine className="w-3.5 h-3.5" />
                    {t("settings.account.profile.edit")}
                  </button>
                ) : null}
              </div>
              {isEditingName ? (
                <div className="space-y-3 pt-1">
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
                <p className="text-base font-semibold text-m3-text">{user.name || "—"}</p>
              )}
            </Surface>

            <Surface className="flex-1">
              <h3 className="text-sm font-semibold text-m3-text flex items-center gap-2 mb-4">
                <Info className="w-4 h-4 text-m3-secondary" />
                {t("settings.account.profile.accountInfo")}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-m3-sidebar/60 rounded-xl border border-m3-border">
                  <span className="text-label block mb-1">
                    {t("settings.account.profile.userId")}
                  </span>
                  <p className="text-xs font-mono text-m3-text truncate">{user.id}</p>
                </div>
                <div className="p-3 bg-m3-sidebar/60 rounded-xl border border-m3-border">
                  <span className="text-label block mb-1">
                    {t("settings.account.profile.accountStatus")}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {t("settings.account.profile.active")}
                  </span>
                </div>
              </div>
            </Surface>
          </div>

          <Surface className="h-full min-w-0 flex flex-col">
            <div className="space-y-6 flex-1">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-label">{t("settings.account.profile.emailAddress")}</span>
                  {!isEditingEmail ? (
                    <button
                      type="button"
                      onClick={() => {
                        setDraftEmail(user.email || "");
                        setIsEditingEmail(true);
                      }}
                      className="text-xs font-semibold text-m3-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <PenLine className="w-3.5 h-3.5" />
                      {t("settings.account.profile.changeEmail")}
                    </button>
                  ) : null}
                </div>
                {isEditingEmail ? (
                  <div className="space-y-3 pt-1">
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
                    {user.email || "—"}
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </p>
                )}
              </div>

              <div className="border-t border-m3-border pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-label flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-m3-primary" />
                    {t("settings.account.profile.password")}
                  </span>
                  {!isEditingPassword ? (
                    <button
                      type="button"
                      onClick={() => setIsEditingPassword(true)}
                      className="text-xs font-semibold text-m3-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      {t("settings.account.profile.changePassword")}
                    </button>
                  ) : null}
                </div>
                {isEditingPassword ? (
                  <div className="space-y-4 pt-2">
                    <GoogleTextField
                      type="password"
                      label={t("settings.account.profile.currentPassword")}
                      value={draftOldPassword}
                      onChange={(e) => setDraftOldPassword(e.target.value)}
                      autoComplete="current-password"
                    />
                    <GoogleTextField
                      type="password"
                      label={t("settings.account.profile.newPassword")}
                      value={draftNewPassword}
                      onChange={(e) => setDraftNewPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                    <GoogleTextField
                      type="password"
                      label={t("settings.account.profile.confirmNewPassword")}
                      value={draftConfirmPassword}
                      onChange={(e) => setDraftConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                    <div className="flex justify-end gap-2 pt-1">
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

              <div className="border-t border-m3-border pt-6">
                <TwoFactorSection
                  enabled={Boolean(user.twoFactorEnabled)}
                  onRefresh={async () => {
                    await syncUser();
                  }}
                  onToast={showToast}
                />
              </div>
            </div>
          </Surface>
        </div>

        <LanguagePreferencesSection onToast={showToast} />

        <SocialAccountsSection onToast={showToast} />

        <NotificationSettingsSection onToast={showToast} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 *:min-w-0 *:h-full">
          <ActiveSessionsSection onToast={showToast} />
          <LoginHistorySection />
        </div>

        <Surface className="space-y-4 border-rose-200/60 dark:border-rose-900/40">
          <div>
            <h3 className="text-sm font-semibold text-m3-danger">{t("account.danger.title")}</h3>
            <p className="text-xs text-m3-secondary mt-1">{t("account.danger.desc")}</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20">
            <div>
              <p className="text-sm font-semibold text-m3-danger">
                {t("account.danger.deleteTitle")}
              </p>
              <p className="text-xs text-m3-secondary mt-0.5">{t("account.danger.deleteDesc")}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => void openDeleteModal()}>
              {t("account.danger.deleteBtn")}
            </Button>
          </div>
        </Surface>
      </div>

      <Modal
        isOpen={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteOtp("");
          setDeleteOtpSent(false);
        }}
        title={
          soleOwnerOrgs.length > 0
            ? t("account.danger.soleOwnerTitle")
            : t("account.danger.otpTitle")
        }
      >
        {deleteChecking ? (
          <div className="flex justify-center py-8">
            <Spinner size="md" label={t("common.loading")} />
          </div>
        ) : soleOwnerOrgs.length > 0 ? (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-m3-secondary">{t("account.danger.soleOwnerDesc")}</p>
            <ul className="space-y-2">
              {soleOwnerOrgs.map((org) => (
                <li
                  key={org.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-m3-border bg-m3-sidebar/60"
                >
                  <span className="text-sm font-semibold text-m3-text">{org.name}</span>
                  <Link
                    href="/account/organization/members"
                    className="text-xs font-semibold text-m3-primary hover:underline"
                    onClick={() => setDeleteOpen(false)}
                  >
                    {t("account.danger.manageOrgLink")}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                {t("common.cancel")}
              </Button>
            </div>
          </div>
        ) : !deleteOtpSent ? (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-m3-secondary">{t("account.danger.deleteDesc")}</p>
            <p className="text-xs text-m3-secondary bg-m3-sidebar/60 p-3 rounded-lg border border-m3-border">
              {t("account.danger.backupRetentionNotice")}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button
                variant="primary"
                isLoading={deleteOtpSending}
                onClick={() => void sendDeleteOtp()}
              >
                {t("account.danger.sendOtpBtn")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-m3-secondary">
              {t("account.danger.otpDesc", { email: user.email || "" })}
            </p>
            <p className="text-xs text-m3-secondary bg-m3-sidebar/60 p-3 rounded-lg border border-m3-border">
              {t("account.danger.backupRetentionNotice")}
            </p>
            <input
              type="text"
              inputMode="numeric"
              value={deleteOtp}
              onChange={(e) => setDeleteOtp(e.target.value)}
              placeholder={t("account.danger.otpLabel")}
              className="w-full rounded-md border border-m3-border bg-m3-card px-3.5 py-2.5 text-sm text-m3-text tracking-widest font-mono"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button
                variant="primary"
                disabled={deleteOtp.trim().length < 4}
                isLoading={deletingAccount}
                onClick={() => void handleConfirmDeleteAccount()}
              >
                {t("account.danger.confirmBtn")}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AccountCenter>
  );
}
