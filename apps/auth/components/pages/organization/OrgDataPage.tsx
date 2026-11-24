// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { AccountCenter } from "@/components/account/AccountCenter";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { authClient } from "@/lib/auth/client";
import { backupApi, type BackupDocument } from "@/lib/services/backup-api";
import { useI18n } from "@/lib/ui/i18n";
import { Button, Can, Modal, PageHeader, Spinner, Surface, useCan } from "@hosanna/ui";
import { AlertTriangle, CheckCircle2, Clock, Download, ExternalLink, Printer, ShieldCheck, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

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

  const [dpaData, setDpaData] = useState<{
    accepted: boolean;
    currentVersion: string;
    agreement: {
      version: string;
      acceptedAt: string;
      acceptedByUser: { name: string; email: string };
    } | null;
  } | null>(null);
  const [dpaLoading, setDpaLoading] = useState(true);
  const [dpaModalOpen, setDpaModalOpen] = useState(false);
  const [dpaConfirmChecked, setDpaConfirmChecked] = useState(false);
  const [dpaAccepting, setDpaAccepting] = useState(false);

  const fetchDpaStatus = useCallback(async () => {
    if (!organization?.id) return;
    setDpaLoading(true);
    try {
      const res = await fetch("/api/organization/agreement");
      if (res.ok) {
        const json = await res.json();
        setDpaData(json);
      }
    } catch {
      // Fail silently for background DPA fetch
    } finally {
      setDpaLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    void fetchDpaStatus();
  }, [fetchDpaStatus]);

  const handleAcceptDpa = async () => {
    if (!organization?.id || !dpaConfirmChecked) return;
    setDpaAccepting(true);
    try {
      const res = await fetch("/api/organization/agreement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agreementType: "dpa", version: dpaData?.currentVersion || "1.0" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to accept agreement");
      }
      showToast(t("org.dpa.acceptSuccess"), "success");
      await fetchDpaStatus();
      setDpaModalOpen(false);
    } catch (err) {
      showToast(
        t("org.dpa.acceptError", {
          error: (err as Error)?.message || "",
        }),
        "error",
      );
    } finally {
      setDpaAccepting(false);
    }
  };

  const showToast = useCallback((msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3500);
  }, []);

  const handleBackup = async () => {
    if (!organization?.id || !canExportPerm.granted) return;
    setIsDownloading(true);
    try {
      await backupApi.downloadBackup({ organizationId: organization.id });
      showToast(t("settings.workspace.exportSuccess"), "success");
    } catch (err) {
      showToast((err as Error)?.message || t("settings.workspace.exportError"), "error");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canImportPerm.granted) return;
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

        <Surface className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-m3-primary" />
                <h3 className="text-sm font-semibold text-m3-text">{t("org.dpa.title")}</h3>
              </div>
              <p className="text-xs text-m3-secondary">{t("org.dpa.desc")}</p>
            </div>
            {dpaLoading ? (
              <Spinner size="sm" />
            ) : dpaData?.accepted ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t("org.dpa.statusAccepted", {
                  date: new Date(dpaData.agreement?.acceptedAt || "").toLocaleDateString(),
                  name: dpaData.agreement?.acceptedByUser?.name || "Admin",
                })}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                <Clock className="w-3.5 h-3.5" />
                {t("org.dpa.statusPending")}
              </span>
            )}
          </div>

          {!dpaLoading && !dpaData?.accepted ? (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300">
              {t("org.dpa.pendingWarning")}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-m3-border/60">
            <a
              href="https://hosanna.live/legal/subprocessors"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-m3-secondary hover:text-m3-primary transition-colors"
            >
              <span>{t("org.dpa.subprocessorsNote")}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <div className="flex items-center gap-2">
              <Button
                variant={dpaData?.accepted ? "outline" : "primary"}
                size="sm"
                onClick={() => setDpaModalOpen(true)}
              >
                {dpaData?.accepted ? t("org.dpa.viewBtn") : t("org.dpa.reviewBtn")}
              </Button>
            </div>
          </div>
        </Surface>

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
                  <p className="text-xs text-m3-secondary mt-0.5">{t("org.danger.leaveDesc")}</p>
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
                  <p className="text-xs text-m3-secondary mt-0.5">{t("org.danger.deleteDesc")}</p>
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
                <span className="text-label text-m3-text block">
                  {t("settings.restore.summary")}
                </span>
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
              <Button variant="primary" isLoading={dangerBusy} onClick={() => void handleLeave()}>
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

        <Modal
          isOpen={dpaModalOpen}
          onClose={() => setDpaModalOpen(false)}
          title={t("org.dpa.modalTitle")}
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 text-xs text-m3-secondary leading-relaxed">
            <div className="p-3 bg-m3-sidebar rounded-md border border-m3-border space-y-1">
              <p><strong className="text-m3-text">Controller:</strong> {organization.name}</p>
              <p><strong className="text-m3-text">Processor:</strong> Hosanna (support@hosanna.live)</p>
              <p><strong className="text-m3-text">Version:</strong> {dpaData?.currentVersion || "1.0"}</p>
              {dpaData?.accepted && dpaData.agreement ? (
                <p>
                  <strong className="text-m3-text">Accepted:</strong>{" "}
                  {new Date(dpaData.agreement.acceptedAt).toLocaleString()} by{" "}
                  {dpaData.agreement.acceptedByUser.name} ({dpaData.agreement.acceptedByUser.email})
                </p>
              ) : null}
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-m3-text">1. Subject Matter, Purpose, and Nature</h4>
                <p className="mt-0.5">
                  Hosanna provides cloud-based worship planning, liturgy management, music library administration,
                  team scheduling, and church collaboration software. Processing is performed exclusively to provide,
                  maintain, and support the Services on documented instructions of the Church.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-m3-text">2. Special Category Data (GDPR Art. 9: Religious Beliefs)</h4>
                <p className="mt-0.5">
                  Organization data, member rosters, ministry positions, and service notes may reveal religious
                  or philosophical beliefs. The Church confirms it maintains a lawful basis under GDPR Article 9(2)(d)
                  (legitimate activities of religious bodies) or Article 9(2)(a) (explicit consent).
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-m3-text">3. Processor Obligations</h4>
                <p className="mt-0.5">
                  Hosanna processes data only on documented instructions, ensures staff confidentiality, implements
                  technical and organizational measures (TLS encryption, AES-256 at rest, query-level tenant isolation,
                  RBAC, 2FA), assists with data-subject requests, notifies the Church within 48 hours of any confirmed
                  data breach, and deletes or exports data upon contract termination.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-m3-text">4. Sub-processors and International Transfers</h4>
                <p className="mt-0.5">
                  The Church authorizes approved sub-processors (Vercel in France, Supabase in Ireland, Redis Cloud in France,
                  PostHog in Germany, Stripe in Ireland). Any transfers outside the EEA are governed by the EU Standard
                  Contractual Clauses (SCCs).
                </p>
              </div>
            </div>

            {!dpaData?.accepted ? (
              <div className="pt-2 border-t border-m3-border space-y-3">
                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={dpaConfirmChecked}
                    onChange={(e) => setDpaConfirmChecked(e.target.checked)}
                    className="mt-0.5 rounded border-m3-border text-m3-primary focus:ring-m3-primary"
                  />
                  <span className="text-xs text-m3-text">{t("org.dpa.churchLawfulBasis")}</span>
                </label>
              </div>
            ) : null}

            <div className="flex items-center justify-between pt-3 border-t border-m3-border">
              <Button
                variant="outline"
                size="sm"
                icon={<Printer className="w-3.5 h-3.5" />}
                onClick={() => window.print()}
              >
                {t("org.dpa.printBtn")}
              </Button>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setDpaModalOpen(false)}>
                  {t("common.back")}
                </Button>
                {!dpaData?.accepted && (capabilities.canManageOrg) ? (
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={!dpaConfirmChecked || dpaAccepting}
                    isLoading={dpaAccepting}
                    onClick={() => void handleAcceptDpa()}
                  >
                    {t("org.dpa.acceptBtn")}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </AccountCenter>
  );
}
