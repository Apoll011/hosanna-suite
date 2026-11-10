"use client";

import { AccountCenter } from "@/components/account/AccountCenter";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { authClient } from "@/lib/auth-client";
import { backupApi, type BackupDocument } from "@/lib/backup-api";
import { useI18n } from "@/lib/i18n";
import { Button, Can, Modal, PageHeader, Spinner, Surface, useCan } from "@hosanna/ui";
import { AlertTriangle, Download, Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";

export function OrgDataPage() {
  const { t } = useI18n();
  const { organization, capabilities, isLoading, refresh, user } = useActiveOrganization();
  const canExportPerm = useCan("backup.export");
  const canImportPerm = useCan("backup.import");

  const restoreInputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<BackupDocument | null>(null);
  const [restoreStats, setRestoreStats] = useState<{
    songs: number;
    folders: number;
    services: number;
  } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const [leaveOpen, setLeaveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [dangerBusy, setDangerBusy] = useState(false);

  const showToast = useCallback((msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3500);
  }, []);

  const handleBackup = async () => {
    if (!organization?.id) return;
    setIsDownloading(true);
    try {
      await backupApi.downloadBackup({ organizationId: organization.id });
      showToast(t("settings.workspace.exportSuccess"), "success");
    } catch (err) {
      showToast(
        (err as Error)?.message || t("settings.workspace.exportError"),
        "error",
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string) as BackupDocument;
        setPendingRestore(json);
        setRestoreStats({
          songs: json.songs?.length || 0,
          services: json.services?.length || 0,
          folders: json.folders?.length || 0,
        });
      } catch {
        showToast(t("settings.workspace.invalidJson"), "error");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleConfirmRestore = async () => {
    if (!pendingRestore || !organization?.id) return;
    setIsRestoring(true);
    try {
      await backupApi.restoreBackup(pendingRestore, {
        organizationId: organization.id,
      });
      showToast(t("settings.restore.success"), "success");
      window.setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      showToast((err as Error)?.message || t("settings.restore.error"), "error");
    } finally {
      setIsRestoring(false);
      setPendingRestore(null);
      setRestoreStats(null);
    }
  };

  const handleLeave = async () => {
    if (!organization) return;
    setDangerBusy(true);
    try {
      await authClient.organization.leave({ organizationId: organization.id });
      showToast(t("settings.memberProfile.leaveSuccess"), "success");
      window.location.assign("/onboarding");
    } catch (err) {
      showToast(
        t("settings.memberProfile.leaveError", {
          error: (err as Error)?.message || "",
        }),
        "error",
      );
    } finally {
      setDangerBusy(false);
      setLeaveOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!organization || deleteConfirm !== organization.name) return;
    setDangerBusy(true);
    try {
      await authClient.organization.delete({ organizationId: organization.id });
      showToast(t("org.danger.deleteSuccess"), "success");
      localStorage.removeItem("active_org_slug");
      window.location.assign("/onboarding");
    } catch (err) {
      showToast(
        t("org.danger.deleteError", {
          error: (err as Error)?.message || "",
        }),
        "error",
      );
    } finally {
      setDangerBusy(false);
      setDeleteOpen(false);
    }
  };

  if (isLoading) {
    return (
      <AccountCenter>
        <div className="flex justify-center py-16">
          <Spinner size="md" label={t("common.loading")} />
        </div>
      </AccountCenter>
    );
  }

  if (!organization) {
    return (
      <AccountCenter>
        <Surface>
          <p className="text-sm text-m3-secondary">{t("org.noOrganization")}</p>
        </Surface>
      </AccountCenter>
    );
  }

  const isOwner = capabilities.isOwner;
  const selfMember = organization.members?.find((m) => m.userId === user?.id);
  const canExport = canExportPerm.granted;
  const canImport = canImportPerm.granted;

  return (
    <AccountCenter toast={toast}>
      <div className="space-y-6">
      <PageHeader
        title={t("settings.workspace.backupTitle")}
        description={t("settings.workspace.backupDesc")}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Can permission="backup.export">
          <Surface className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-m3-text">
                {t("settings.workspace.exportData")}
              </h3>
              <p className="text-xs text-m3-secondary mt-1">
                {t("settings.workspace.exportDesc")}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-center"
              onClick={() => void handleBackup()}
              disabled={isDownloading}
              isLoading={isDownloading}
              icon={<Download className="w-4 h-4" />}
            >
              {isDownloading
                ? t("settings.workspace.exportProcessing")
                : t("settings.workspace.exportDownloadBtn")}
            </Button>
          </Surface>
        </Can>

        <Can permission="backup.import">
          <Surface className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-m3-text">
                {t("settings.workspace.restoreData")}
              </h3>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                {t("settings.workspace.restoreWarning")}
              </p>
            </div>
            <input
              ref={restoreInputRef}
              type="file"
              accept=".hosanna,application/json"
              onChange={handleRestoreFile}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              className="w-full justify-center"
              onClick={() => restoreInputRef.current?.click()}
              icon={<Upload className="w-4 h-4" />}
            >
              {t("settings.workspace.restoreUploadBtn")}
            </Button>
          </Surface>
        </Can>
      </div>

      {!canExport && !canImport && !canExportPerm.loading && !canImportPerm.loading ? (
        <Surface className="py-8 text-center">
          <p className="text-sm text-m3-secondary">{t("org.data.noBackupAccess")}</p>
        </Surface>
      ) : null}

      {!canExport && !canImport ? (
        <Surface>
          <p className="text-sm text-m3-secondary">{t("org.data.noBackupAccess")}</p>
        </Surface>
      ) : null}

      <Surface className="space-y-4 border-rose-200/60 dark:border-rose-900/40">
        <div>
          <h3 className="text-sm font-semibold text-m3-danger">{t("org.danger.title")}</h3>
          <p className="text-xs text-m3-secondary mt-1">{t("org.danger.desc")}</p>
        </div>

        <div className="space-y-3">
          {selfMember ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-m3-border">
              <div>
                <p className="text-sm font-semibold text-m3-text">
                  {t("settings.memberProfile.leaveOrg")}
                </p>
                <p className="text-xs text-m3-secondary mt-0.5">
                  {t("org.danger.leaveDesc")}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setLeaveOpen(true)}>
                {t("settings.memberProfile.leaveOrg")}
              </Button>
            </div>
          ) : null}

          {isOwner ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20">
              <div>
                <p className="text-sm font-semibold text-m3-danger">
                  {t("org.danger.deleteTitle")}
                </p>
                <p className="text-xs text-m3-secondary mt-0.5">
                  {t("org.danger.deleteDesc")}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)}>
                {t("org.danger.deleteBtn")}
              </Button>
            </div>
          ) : null}
        </div>
      </Surface>

      <Modal
        isOpen={Boolean(pendingRestore)}
        onClose={() => {
          setPendingRestore(null);
          setRestoreStats(null);
        }}
        title={t("settings.restore.confirmTitle")}
      >
        <div className="flex flex-col gap-4">
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-md flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
            <div>
              <strong className="font-semibold">{t("settings.restore.attention")}</strong>
              <p className="mt-0.5">{t("settings.restore.attentionDesc")}</p>
            </div>
          </div>

          {restoreStats ? (
            <div className="space-y-2">
              <span className="text-label text-m3-text block">{t("settings.restore.summary")}</span>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-m3-sidebar rounded-md border border-m3-border">
                  <span className="block text-lg font-semibold text-m3-primary tabular-nums">
                    {restoreStats.songs}
                  </span>
                  <span className="text-caption">{t("settings.restore.songs")}</span>
                </div>
                <div className="p-2 bg-m3-sidebar rounded-md border border-m3-border">
                  <span className="block text-lg font-semibold text-amber-500 tabular-nums">
                    {restoreStats.folders}
                  </span>
                  <span className="text-caption">{t("settings.restore.folders")}</span>
                </div>
                <div className="p-2 bg-m3-sidebar rounded-md border border-m3-border">
                  <span className="block text-lg font-semibold text-emerald-600 tabular-nums">
                    {restoreStats.services}
                  </span>
                  <span className="text-caption">{t("settings.restore.services")}</span>
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setPendingRestore(null);
                setRestoreStats(null);
              }}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="primary"
              isLoading={isRestoring}
              onClick={() => void handleConfirmRestore()}
            >
              {t("settings.restore.restoreNow")}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        title={t("settings.memberProfile.leaveConfirmTitle")}
      >
        <div className="space-y-4 pt-2">
          <p className="text-sm text-m3-secondary">
            {t("settings.memberProfile.leaveConfirmText")}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setLeaveOpen(false)}>
              {t("common.back")}
            </Button>
            <Button
              variant="primary"
              isLoading={dangerBusy}
              onClick={() => void handleLeave()}
            >
              {t("settings.memberProfile.leaveOrg")}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteConfirm("");
        }}
        title={t("org.danger.deleteConfirmTitle")}
      >
        <div className="space-y-4 pt-2">
          <p className="text-sm text-m3-secondary">
            {t("org.danger.deleteConfirmText", { name: organization.name })}
          </p>
          <input
            type="text"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder={organization.name}
            className="w-full rounded-md border border-m3-border bg-m3-card px-3.5 py-2.5 text-sm text-m3-text"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteOpen(false);
                setDeleteConfirm("");
              }}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="primary"
              disabled={deleteConfirm !== organization.name}
              isLoading={dangerBusy}
              onClick={() => void handleDelete()}
            >
              {t("org.danger.deleteBtn")}
            </Button>
          </div>
        </div>
      </Modal>
      </div>
    </AccountCenter>
  );
}
