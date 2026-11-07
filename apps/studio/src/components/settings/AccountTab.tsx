/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Input, Surface } from "@/src/components/common";
import { useI18n } from "@/src/lib/i18n";
import {
  Camera,
  CheckCircle2,
  Info,
  KeyRound,
  Lock,
  PenLine,
  Save,
  Trash2,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useSync } from "../../contexts/SyncContext";
import { authClient } from "../../lib/authClient";
import { compressImage, getRoleBadge } from "../../utils/settingsUtils";
import { ActiveSessionsSection } from "./ActiveSession";
import { LoginHistorySection } from "./LoginHistorySection";
import { SocialAccountsSection } from "./SocialAccounts";
import { TwoFactorSection } from "./TwoFactor";

export const AccountTab: React.FC<{ active: boolean }> = ({ active }) => {
  const { user, refetch: refetchAuth } = useAuth();
  const { showToast } = useSync();
  const { t } = useI18n();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [displayUser, setDisplayUser] = useState(user);

  useEffect(() => {
    setDisplayUser(user);
  }, [user]);

  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);

  const [draftName, setDraftName] = useState("");
  const [draftEmail, setDraftEmail] = useState("");
  const [draftOldPassword, setDraftOldPassword] = useState("");
  const [draftNewPassword, setDraftNewPassword] = useState("");
  const [draftConfirmPassword, setDraftConfirmPassword] = useState("");
  const [isCompressingAvatar, setIsCompressingAvatar] = useState(false);

  if (!active) return null;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast(t("settings.account.profile.invalidImage"), "error");
      return;
    }

    try {
      setIsCompressingAvatar(true);
      const compressedBase64 = await compressImage(file, 800, 0.8);

      setDisplayUser((prev) =>
        prev ? { ...prev, image: compressedBase64 } : prev,
      );

      await authClient.updateUser({ image: compressedBase64 });
      await refetchAuth();
      showToast(t("settings.account.profile.avatarUpdated"), "success");
    } catch (err: unknown) {
      showToast(
        t("settings.account.profile.avatarUpdateError", {
          error: (err as Error).message || "Erro de rede",
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
      setDisplayUser((prev) => (prev ? { ...prev, image: undefined } : prev));
      await authClient.updateUser({ image: "" });
      await refetchAuth();
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
      setDisplayUser((prev) => (prev ? { ...prev, name: draftName } : prev));
      setIsEditingName(false);

      await authClient.updateUser({ name: draftName });
      await refetchAuth();
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
      setIsEditingEmail(false);
      await authClient.changeEmail({ newEmail: draftEmail });
      await refetchAuth();
      showToast(t("settings.account.profile.emailChangeSent"), "success");
    } catch (err: unknown) {
      showToast(
        t("settings.account.profile.emailChangeError", {
          error: (err as Error).message || "Tente novamente",
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
          error: (err as Error).message || "Verifique a palavra-passe atual",
        }),
        "error",
      );
    }
  };

  const getUserInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((w) => w.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      <Surface>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="w-16 h-16 rounded-full bg-linear-to-tr from-sky-600 to-indigo-600 flex items-center justify-center font-semibold text-white text-xl overflow-hidden shadow-[var(--shadow-sm)]">
                {displayUser?.image ||
                (displayUser as { logo?: string })?.logo ? (
                  <img
                    src={
                      (displayUser?.image ||
                        (displayUser as { logo?: string })?.logo) as string
                    }
                    alt={displayUser?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{getUserInitials(displayUser?.name)}</span>
                )}
              </div>

              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={isCompressingAvatar}
                className="absolute bottom-0 right-0 p-1.5 bg-m3-primary text-white rounded-full shadow-[var(--shadow-sm)] hover:bg-m3-primary/90 transition-colors cursor-pointer"
                title={t("settings.account.profile.changeAvatarTitle")}
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <h2 className="text-title text-m3-text flex items-center gap-2">
                {displayUser?.name || t("settings.account.user")}
                {getRoleBadge(
                  (displayUser as { role?: string })?.role || "member",
                  t,
                )}
              </h2>
              <p className="text-caption mt-0.5">{displayUser?.email}</p>
            </div>
          </div>

          {(displayUser?.image || (displayUser as { logo?: string })?.logo) && (
            <button
              type="button"
              onClick={handleRemoveAvatar}
              className="text-xs font-semibold text-m3-danger hover:opacity-80 flex items-center gap-1 self-start sm:self-center cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t("settings.account.profile.removeAvatar")}
            </button>
          )}
        </div>
      </Surface>

      <Surface>
        <div className="flex items-center justify-between mb-2">
          <label className="text-label">
            {t("settings.account.profile.displayName")}
          </label>
          {!isEditingName && (
            <button
              onClick={() => {
                setDraftName(displayUser?.name || "");
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
          <div className="space-y-3 pt-1">
            <Input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder={t("settings.account.profile.namePlaceholder")}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingName(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveName}
                icon={<Save className="w-4 h-4" />}
              >
                {t("common.save")}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-base font-semibold text-m3-text">
            {displayUser?.name || "—"}
          </p>
        )}
      </Surface>

      <Surface>
        <div className="flex items-center justify-between mb-2">
          <label className="text-label">
            {t("settings.account.profile.emailAddress")}
          </label>
          {!isEditingEmail && (
            <button
              onClick={() => {
                setDraftEmail(displayUser?.email || "");
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
          <div className="space-y-3 pt-1">
            <Input
              type="email"
              value={draftEmail}
              onChange={(e) => setDraftEmail(e.target.value)}
              placeholder={t("settings.account.profile.emailPlaceholder")}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingEmail(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveEmail}
                icon={<Save className="w-4 h-4" />}
              >
                {t("settings.account.profile.saveEmail")}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-base font-semibold text-m3-text">
            {displayUser?.email || "—"}
          </p>
        )}
      </Surface>

      <Surface>
        <div className="flex items-center justify-between mb-2">
          <label className="text-label flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-m3-primary" />
            {t("settings.account.profile.password")}
          </label>
          {!isEditingPassword && (
            <button
              onClick={() => setIsEditingPassword(true)}
              className="text-xs font-semibold text-m3-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              {t("settings.account.profile.changePassword")}
            </button>
          )}
        </div>

        {isEditingPassword ? (
          <div className="space-y-4 pt-2">
            <Input
              type="password"
              label={t("settings.account.profile.currentPassword")}
              value={draftOldPassword}
              onChange={(e) => setDraftOldPassword(e.target.value)}
            />
            <Input
              type="password"
              label={t("settings.account.profile.newPassword")}
              value={draftNewPassword}
              onChange={(e) => setDraftNewPassword(e.target.value)}
            />
            <Input
              type="password"
              label={t("settings.account.profile.confirmNewPassword")}
              value={draftConfirmPassword}
              onChange={(e) => setDraftConfirmPassword(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2">
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
                onClick={handleSavePassword}
                icon={<Save className="w-4 h-4" />}
              >
                {t("settings.account.profile.updatePassword")}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-base font-semibold text-m3-text">••••••••••••</p>
        )}
      </Surface>

      <SocialAccountsSection />

      <TwoFactorSection />

      <ActiveSessionsSection />

      <LoginHistorySection scope="self" active={active} />

      <Surface>
        <h3 className="text-sm font-semibold text-m3-text flex items-center gap-2 mb-4">
          <Info className="w-4 h-4 text-m3-secondary" />
          {t("settings.account.profile.accountInfo")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3 bg-m3-sidebar/60 rounded-[var(--radius-md)] border border-m3-border">
            <span className="text-label block mb-1">
              {t("settings.account.profile.userId")}
            </span>
            <p className="text-xs font-mono text-m3-text truncate">
              {displayUser?.id || "—"}
            </p>
          </div>
          <div className="p-3 bg-m3-sidebar/60 rounded-[var(--radius-md)] border border-m3-border">
            <span className="text-label block mb-1">
              {t("settings.account.profile.role")}
            </span>
            {getRoleBadge(
              (displayUser as { role?: string })?.role || "member",
              t,
            )}
          </div>
          <div className="p-3 bg-m3-sidebar/60 rounded-[var(--radius-md)] border border-m3-border">
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
  );
};
