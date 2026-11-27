/**
 * @license
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
  songsApi,
  type SongImportCancelCode,
  type SongImportJob,
  type SongImportStep,
} from "@/src/api/songs";
import { useFolders } from "@/src/hooks/useFolders";
import { useI18n, type TranslationKey } from "@/src/lib/i18n";
import type {
  SheetMusicImportOptions,
  SheetMusicImportSession,
} from "@/src/lib/import/sheetMusicProvider";
import type { InteractiveImportModalProps } from "@/src/lib/import/types";
import { ChordProRenderer, parseChordPro } from "@hosanna/chordpro";
import { Button, Input, Modal, SpringDropdown, type SpringDropdownOption } from "@hosanna/ui";
import { AlertTriangle, Check, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";

export type SheetMusicImportModalProps = InteractiveImportModalProps<
  SheetMusicImportSession,
  SheetMusicImportOptions
>;

const POLL_INTERVAL_MS = 900;

const cancelReasonKeys: Record<SongImportCancelCode, TranslationKey> = {
  not_a_song: "modals.sheetMusicImport.cancelReasons.not_a_song",
  unreadable: "modals.sheetMusicImport.cancelReasons.unreadable",
  blank: "modals.sheetMusicImport.cancelReasons.blank",
  wrong_content: "modals.sheetMusicImport.cancelReasons.wrong_content",
  multiple_unclear: "modals.sheetMusicImport.cancelReasons.multiple_unclear",
};

const stepLabelKeys: Record<string, TranslationKey> = {
  process: "modals.sheetMusicImport.steps.process",
  extract: "modals.sheetMusicImport.steps.extract",
  metadata: "modals.sheetMusicImport.steps.metadata",
  verify: "modals.sheetMusicImport.steps.verify",
  draft: "modals.sheetMusicImport.steps.draft",
};

const CircularProgress: React.FC = () => (
  <svg className="w-7 h-7 animate-spin" viewBox="0 0 28 28" fill="none" aria-hidden>
    <circle cx="14" cy="14" r="11" stroke="currentColor" strokeOpacity="0.15" strokeWidth="3" />
    <circle
      cx="14"
      cy="14"
      r="11"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeDasharray="20 49"
      className="text-m3-primary"
    />
  </svg>
);

const StepProgress: React.FC<{ steps: SongImportStep[]; labelFor: (id: string) => string }> = ({
  steps,
  labelFor,
}) => (
  <div className="flex items-start">
    {steps.map((step, i) => (
      <React.Fragment key={step.id}>
        <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
          <div
            className={[
              "flex items-center justify-center w-10 h-10 rounded-full transition-colors duration-300",
              step.done
                ? "bg-m3-success text-white"
                : step.active
                  ? "bg-m3-primary/10 text-m3-primary"
                  : "bg-m3-sidebar text-m3-secondary/60",
            ].join(" ")}
          >
            {step.done ? (
              <Check className="w-5 h-5" />
            ) : step.active ? (
              <CircularProgress />
            ) : (
              <span className="w-2 h-2 rounded-full bg-current" />
            )}
          </div>
          <span
            className={[
              "text-[11px] leading-tight text-center max-w-21",
              step.done || step.active ? "text-m3-text font-medium" : "text-m3-secondary/70",
            ].join(" ")}
          >
            {labelFor(step.id)}
          </span>
        </div>
        {i < steps.length - 1 && (
          <div className="relative w-6 sm:w-10 h-0.5 mt-5 -mx-0.5 bg-m3-border overflow-hidden rounded-full shrink-0">
            <div
              className={[
                "absolute inset-y-0 left-0 bg-m3-success transition-all duration-500",
                steps[i]!.done ? "w-full" : steps[i]!.active ? "w-1/2" : "w-0",
              ].join(" ")}
            />
          </div>
        )}
      </React.Fragment>
    ))}
  </div>
);

const TerminalBanner: React.FC<{
  title: string;
  message: string;
  tone: "error" | "warning";
}> = ({ title, message, tone }) => (
  <div
    role="alert"
    className={[
      "flex items-start gap-3 rounded-xl border px-3.5 py-3",
      tone === "error" ? "border-red-500/30 bg-red-500/5" : "border-amber-500/30 bg-amber-500/5",
    ].join(" ")}
  >
    <AlertTriangle
      className={`w-4 h-4 shrink-0 mt-0.5 ${tone === "error" ? "text-red-500" : "text-amber-500"}`}
    />
    <div className="min-w-0">
      <p className="m-0 text-sm font-semibold text-m3-text">{title}</p>
      <p className="m-0 mt-0.5 text-[12.5px] text-m3-secondary leading-relaxed">{message}</p>
    </div>
  </div>
);

export const SheetMusicImportModal: React.FC<SheetMusicImportModalProps> = ({
  isOpen,
  session,
  isImporting = false,
  onClose,
  onConfirm,
}) => {
  const { t } = useI18n();
  const { foldersQuery } = useFolders();
  const folders = foldersQuery.data?.folders ?? [];
  const folderOptions = useMemo<SpringDropdownOption<string>[]>(
    () => [
      { id: "", label: t("forms.rootLevel") },
      ...folders.map((folder) => ({ id: folder.id, label: folder.name })),
    ],
    [folders, t],
  );

  const [job, setJob] = useState<SongImportJob | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [tab, setTab] = useState<"preview" | "editor">("preview");

  const [form, setForm] = useState({
    title: "",
    artist: "",
    key: "",
    tempo: "",
    timeSignature: "",
    folderId: "",
    tags: "",
    content: "",
  });
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!isOpen || !session) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      try {
        const next = await songsApi.getImportJob(session.jobId);
        if (!active) return;
        setJob(next);
        setPollError(null);
        if (next.status === "completed" && next.result && !initializedRef.current) {
          initializedRef.current = true;
          setForm({
            title: next.result.title ?? "",
            artist: next.result.artist ?? "",
            key: next.result.key ?? "",
            tempo: next.result.tempo ?? "",
            timeSignature: next.result.timeSignature ?? "",
            folderId: "",
            tags: "",
            content: next.result.content ?? "",
          });
        }
        if (next.status === "queued" || next.status === "running") {
          timer = setTimeout(poll, POLL_INTERVAL_MS);
        }
      } catch (err) {
        if (!active) return;
        setPollError(err instanceof Error ? err.message : t("modals.sheetMusicImport.failed"));
        timer = setTimeout(poll, POLL_INTERVAL_MS * 2);
      }
    };

    void poll();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [isOpen, session, t]);

  const [prevOpen, setPrevOpen] = useState(isOpen);
  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen);
    if (!isOpen) {
      setJob(null);
      setPollError(null);
      setCancelling(false);
    }
  }

  useEffect(() => {
    if (!isOpen) {
      initializedRef.current = false;
    }
  }, [isOpen]);

  const parsed = useMemo(() => {
    try {
      return parseChordPro(form.content);
    } catch {
      return null;
    }
  }, [form.content]);

  const terminal = job && (job.status === "cancelled" || job.status === "failed");
  const running = job?.status === "queued" || job?.status === "running";
  const reviewReady = job?.status === "completed" && Boolean(job.result);

  const cancelJob = async () => {
    if (!session || cancelling) return;
    setCancelling(true);
    try {
      const next = await songsApi.cancelImportJob(session.jobId);
      setJob(next);
    } catch (err) {
      setPollError(err instanceof Error ? err.message : t("modals.sheetMusicImport.failed"));
    } finally {
      setCancelling(false);
    }
  };

  const save = async () => {
    const title = form.title.trim();
    if (!title || !form.content.trim() || isImporting) return;
    const tags = form.tags
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    await onConfirm({
      title,
      artist: form.artist.trim(),
      content: form.content.trim(),
      key: form.key.trim() || undefined,
      tempo: form.tempo.trim() || undefined,
      timeSignature: form.timeSignature.trim() || undefined,
      folderId: form.folderId || null,
      tags,
    });
  };

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const confidence = job?.result?.confidence;
  const confidencePct =
    typeof confidence === "number" ? Math.round(Math.min(1, Math.max(0, confidence)) * 100) : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isImporting && !running) onClose();
      }}
      title={t("modals.sheetMusicImport.title")}
      maxWidth="xl"
      footer={
        <>
          {running ? (
            <Button variant="ghost" onClick={cancelJob} disabled={cancelling}>
              {cancelling ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("modals.sheetMusicImport.cancelling")}
                </>
              ) : (
                t("modals.sheetMusicImport.cancel")
              )}
            </Button>
          ) : (
            <Button variant="ghost" onClick={onClose} disabled={isImporting}>
              {t("common.cancel")}
            </Button>
          )}
          {reviewReady && (
            <Button onClick={save} disabled={!form.title.trim() || isImporting}>
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("modals.sheetMusicImport.saving")}
                </>
              ) : (
                t("modals.sheetMusicImport.saveSong")
              )}
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-5">
        <p className="m-0 text-xs leading-relaxed text-m3-secondary">
          {t("modals.importRightsNotice")}
        </p>
        {session && (
          <div className="flex items-center gap-3 rounded-xl border border-m3-border bg-m3-sidebar/40 px-3 py-2.5">
            {session.sourceType === "pdf" ? (
              <FileText className="w-4 h-4 text-m3-primary shrink-0" />
            ) : (
              <ImageIcon className="w-4 h-4 text-m3-primary shrink-0" />
            )}
            <span className="min-w-0 flex-1 truncate text-[12.5px] text-m3-text">
              {session.fileName}
            </span>
            <span className="text-[11px] text-m3-secondary shrink-0">
              {session.pageCount > 1
                ? t("modals.sheetMusicImport.pageCount", { count: session.pageCount })
                : t("modals.sheetMusicImport.singlePage")}
            </span>
          </div>
        )}

        {pollError && !job && (
          <TerminalBanner
            title={t("modals.sheetMusicImport.errorTitle")}
            message={pollError}
            tone="error"
          />
        )}

        {job && running && (
          <div className="space-y-5">
            <StepProgress
              steps={job.steps}
              labelFor={(id) => t(stepLabelKeys[id] ?? "modals.sheetMusicImport.title")}
            />
            <p className="m-0 text-[12.5px] text-m3-secondary text-center animate-pulse">
              {t("modals.sheetMusicImport.processing")}
            </p>
          </div>
        )}

        {terminal && (
          <TerminalBanner
            title={
              job.status === "failed"
                ? t("modals.sheetMusicImport.errorTitle")
                : t("modals.sheetMusicImport.cancelledTitle")
            }
            message={
              job.status === "failed"
                ? (job.errorMessage ?? t("modals.sheetMusicImport.failed"))
                : job.cancelledBy === "ai" && job.cancelCode
                  ? t(cancelReasonKeys[job.cancelCode], { reason: job.cancelReason ?? "" })
                  : (job.cancelReason ?? t("modals.sheetMusicImport.cancelledByUser"))
            }
            tone={job.status === "failed" ? "error" : "warning"}
          />
        )}

        {reviewReady && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 flex-wrap">
              {confidencePct !== null && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-m3-primary/10 px-2.5 py-1 text-[11px] font-medium text-m3-primary">
                  <Check className="w-3.5 h-3.5" />
                  {t("modals.sheetMusicImport.confidence", { value: confidencePct })}
                </span>
              )}
              {job.result?.warnings?.length ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {t("modals.sheetMusicImport.warningsCount", {
                    count: job.result.warnings.length,
                  })}
                </span>
              ) : null}
            </div>

            {job.result?.warnings?.length ? (
              <ul className="m-0 list-none rounded-xl border border-amber-500/25 bg-amber-500/5 px-3.5 py-2.5 space-y-1">
                {job.result.warnings.map((w, i) => (
                  <li key={i} className="text-[12px] text-m3-secondary leading-relaxed">
                    {w}
                  </li>
                ))}
              </ul>
            ) : null}

            {job.result?.possibleDuplicates?.length ? (
              <div className="rounded-xl border border-m3-border bg-m3-sidebar/40 px-3.5 py-2.5 space-y-1.5">
                <p className="m-0 text-[11px] font-semibold uppercase tracking-wide text-m3-secondary">
                  {t("modals.sheetMusicImport.duplicateWarning")}
                </p>
                {job.result.possibleDuplicates.map((d) => (
                  <p key={d.id} className="m-0 text-[12px] text-m3-text">
                    “{d.title}”{d.artist ? ` — ${d.artist}` : ""}
                  </p>
                ))}
              </div>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label={t("forms.songTitle")}
                value={form.title}
                onChange={(e) => set("title")(e.currentTarget.value)}
              />
              <Input
                label={t("forms.artistLabel")}
                value={form.artist}
                onChange={(e) => set("artist")(e.currentTarget.value)}
              />
              <Input
                label={t("modals.sheetMusicImport.key")}
                value={form.key}
                onChange={(e) => set("key")(e.currentTarget.value)}
              />
              <Input
                label={t("modals.sheetMusicImport.tempo")}
                value={form.tempo}
                onChange={(e) => set("tempo")(e.currentTarget.value)}
              />
              <Input
                label={t("modals.sheetMusicImport.timeSignature")}
                value={form.timeSignature}
                onChange={(e) => set("timeSignature")(e.currentTarget.value)}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-label ml-0.5">{t("forms.folderCategory")}</label>
                <SpringDropdown
                  mode="single"
                  options={folderOptions}
                  selected={form.folderId}
                  onChange={(folderId) => set("folderId")(folderId)}
                  ariaLabel={t("forms.folderCategory")}
                  className="h-11 w-full justify-between text-sm"
                />
              </div>
            </div>

            <Input
              label={t("forms.tagsLabel")}
              value={form.tags}
              onChange={(e) => set("tags")(e.currentTarget.value)}
              placeholder={t("forms.tagsPlaceholder")}
            />

            <div>
              <div className="flex items-center gap-1 mb-2 rounded-lg bg-m3-sidebar/50 p-1 w-fit">
                <button
                  type="button"
                  onClick={() => setTab("preview")}
                  className={`px-3 py-1 rounded-md text-[11.5px] font-medium transition-colors ${
                    tab === "preview" ? "bg-m3-card text-m3-text shadow-sm" : "text-m3-secondary"
                  }`}
                >
                  {t("modals.sheetMusicImport.preview")}
                </button>
                <button
                  type="button"
                  onClick={() => setTab("editor")}
                  className={`px-3 py-1 rounded-md text-[11.5px] font-medium transition-colors ${
                    tab === "editor" ? "bg-m3-card text-m3-text shadow-sm" : "text-m3-secondary"
                  }`}
                >
                  {t("modals.sheetMusicImport.rawEditor")}
                </button>
              </div>

              {tab === "preview" ? (
                <div className="hosanna-sheet rounded-xl border border-m3-border bg-m3-card max-h-80 overflow-auto px-4 py-3">
                  {parsed ? (
                    <ChordProRenderer song={parsed} fontSize={13} />
                  ) : (
                    <pre className="m-0 text-[12px] text-m3-secondary whitespace-pre-wrap">
                      {form.content}
                    </pre>
                  )}
                </div>
              ) : (
                <textarea
                  value={form.content}
                  onChange={(e) => set("content")(e.currentTarget.value)}
                  spellCheck={false}
                  className="w-full h-80 resize-y rounded-xl border border-m3-border bg-m3-card text-m3-text font-mono text-[12px] leading-relaxed px-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-m3-primary/25 focus:border-m3-primary"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
