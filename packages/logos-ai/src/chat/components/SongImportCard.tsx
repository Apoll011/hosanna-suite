/**
 * @license
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { dispatchLibraryChanged } from "../../core/bridge";
import { useLogosHost, useLogosI18n } from "../../host";
import type { SongImportJob, SongImportStep } from "../../types";
import { AlertTriangle, Check, FileText, Loader2, Music, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

const POLL_INTERVAL_MS = 900;

const CircularProgress: React.FC = () => (
  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2.5" />
    <circle
      cx="12"
      cy="12"
      r="9"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeDasharray="16 44"
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
        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
          <div
            className={[
              "flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-300",
              step.done
                ? "bg-m3-success text-white"
                : step.active
                  ? "bg-m3-primary/10 text-m3-primary"
                  : "bg-m3-sidebar text-m3-secondary/60",
            ].join(" ")}
          >
            {step.done ? (
              <Check className="w-4 h-4" />
            ) : step.active ? (
              <CircularProgress />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
            )}
          </div>
          <span
            className={[
              "text-[10px] leading-tight text-center max-w-[68px]",
              step.done || step.active ? "text-m3-text font-medium" : "text-m3-secondary/70",
            ].join(" ")}
          >
            {labelFor(step.id)}
          </span>
        </div>
        {i < steps.length - 1 && (
          <div className="relative w-4 sm:w-6 h-0.5 mt-4 bg-m3-border overflow-hidden rounded-full shrink-0">
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

/**
 * Live import card shown after `songs_import_sheet` stages a job. Polls the
 * job, animates the pipeline steps, then offers a one-click "Save Song".
 */
export const AiSongImportCard: React.FC<{ jobId: string }> = ({ jobId }) => {
  const host = useLogosHost();
  const { t } = useLogosI18n();

  const [job, setJob] = useState<SongImportJob | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showContent, setShowContent] = useState(false);

  const [form, setForm] = useState({
    title: "",
    artist: "",
    key: "",
    tempo: "",
    content: "",
  });
  const initializedRef = useRef(false);

  const canPoll = Boolean(host.api.getImportJob);
  const canSave = Boolean(host.api.createSong);

  useEffect(() => {
    if (!canPoll) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      try {
        const next = await host.api.getImportJob!(jobId);
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
            content: next.result.content ?? "",
          });
        }
        if (next.status === "queued" || next.status === "running") {
          timer = setTimeout(poll, POLL_INTERVAL_MS);
        }
      } catch (err) {
        if (!active) return;
        setPollError(err instanceof Error ? err.message : t("ai.chat.import.errorTitle"));
      }
    };

    void poll();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [canPoll, jobId, host.api]);

  const cancel = async () => {
    if (!host.api.cancelImportJob || cancelling) return;
    setCancelling(true);
    try {
      setJob(await host.api.cancelImportJob(jobId));
    } catch (err) {
      setPollError(err instanceof Error ? err.message : t("ai.chat.import.errorTitle"));
    } finally {
      setCancelling(false);
    }
  };

  const save = async () => {
    if (!host.api.createSong || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      await host.api.createSong({
        title: form.title.trim(),
        artist: form.artist.trim(),
        content: form.content.trim(),
        folderId: null,
      });
      setSaved(true);
      dispatchLibraryChanged({ action: "songs_import_sheet", id: jobId });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t("ai.chat.import.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const cancelCode = job?.cancelCode;
  const reason =
    job?.cancelledBy === "ai" && cancelCode
      ? t(`ai.chat.import.cancelReasons.${cancelCode}`)
      : (job?.cancelReason ?? t("ai.chat.import.cancelledByUser"));

  if (!canPoll) {
    return (
      <div className="logos-msg-in mt-1.5 rounded-lg border border-m3-border bg-m3-card px-3 py-2.5 text-[12px] text-m3-secondary">
        {t("ai.chat.import.unsupported")}
      </div>
    );
  }

  const running = job?.status === "queued" || job?.status === "running";
  const terminal = job && (job.status === "failed" || job.status === "cancelled");
  const reviewReady = job?.status === "completed" && Boolean(job.result);

  if (saved) {
    return (
      <div className="logos-msg-in mt-1.5 rounded-lg border border-m3-success/30 bg-m3-card px-3 py-2.5">
        <div className="flex items-center gap-2 text-m3-success">
          <Check className="w-4 h-4" />
          <span className="text-[12.5px] font-semibold">{t("ai.chat.import.saved")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="logos-msg-in mt-1.5 rounded-lg border border-m3-primary/30 bg-m3-card overflow-hidden">
      <div className="flex items-center gap-2 px-2.5 py-2 border-b border-m3-border/70">
        <Music className="w-3.5 h-3.5 text-m3-primary shrink-0" />
        <p className="m-0 text-xs font-semibold text-m3-text truncate">
          {t("ai.chat.import.title")}
        </p>
      </div>

      <div className="px-3 py-3 space-y-3">
        {running && job && (
          <>
            <StepProgress steps={job.steps} labelFor={(id) => t(`ai.chat.import.steps.${id}`)} />
            <p className="m-0 text-[11.5px] text-m3-secondary text-center animate-pulse">
              {t("ai.chat.import.processing")}
            </p>
          </>
        )}

        {pollError && !job && (
          <div className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/5 px-2.5 py-2 text-[12px] text-red-600 dark:text-red-400">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span className="min-w-0 flex-1">{pollError}</span>
          </div>
        )}

        {terminal && (
          <div
            className={`flex items-start gap-2 rounded-md border px-2.5 py-2 text-[12px] ${
              job.status === "failed"
                ? "border-red-500/30 bg-red-500/5 text-red-600 dark:text-red-400"
                : "border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span className="min-w-0 flex-1">
              {job.status === "failed"
                ? (job.errorMessage ?? t("ai.chat.import.errorTitle"))
                : reason}
            </span>
          </div>
        )}

        {reviewReady && (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              {typeof job.result?.confidence === "number" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-m3-primary/10 px-2 py-0.5 text-[10.5px] font-medium text-m3-primary">
                  {t("ai.chat.import.confidence", {
                    value: Math.round(job.result.confidence * 100),
                  })}
                </span>
              )}
              {job.result?.possibleDuplicates?.length ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10.5px] font-medium text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-3 h-3" />
                  {t("ai.chat.import.duplicateWarning")}
                </span>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="col-span-2">
                <span className="block text-[10px] font-semibold uppercase tracking-wide text-m3-secondary mb-0.5">
                  {t("ai.chat.import.fieldTitle")}
                </span>
                <input
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.currentTarget.value }))}
                  className="w-full rounded-md border border-m3-border bg-m3-bg px-2 py-1.5 text-[12px] text-m3-text focus:outline-none focus:border-m3-primary"
                />
              </label>
              <label>
                <span className="block text-[10px] font-semibold uppercase tracking-wide text-m3-secondary mb-0.5">
                  {t("ai.chat.import.fieldArtist")}
                </span>
                <input
                  value={form.artist}
                  onChange={(e) => setForm((p) => ({ ...p, artist: e.currentTarget.value }))}
                  className="w-full rounded-md border border-m3-border bg-m3-bg px-2 py-1.5 text-[12px] text-m3-text focus:outline-none focus:border-m3-primary"
                />
              </label>
              <label>
                <span className="block text-[10px] font-semibold uppercase tracking-wide text-m3-secondary mb-0.5">
                  {t("ai.chat.import.fieldKey")}
                </span>
                <input
                  value={form.key}
                  onChange={(e) => setForm((p) => ({ ...p, key: e.currentTarget.value }))}
                  className="w-full rounded-md border border-m3-border bg-m3-bg px-2 py-1.5 text-[12px] text-m3-text focus:outline-none focus:border-m3-primary"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() => setShowContent((v) => !v)}
              className="inline-flex items-center gap-1.5 text-[11px] text-m3-secondary hover:text-m3-text"
            >
              <FileText className="w-3 h-3" />
              {showContent ? t("ai.chat.import.hideChordPro") : t("ai.chat.import.showChordPro")}
            </button>
            {showContent && (
              <pre className="m-0 max-h-40 overflow-auto rounded-md border border-m3-border/70 bg-m3-bg px-2.5 py-2 text-[11px] leading-snug font-mono text-m3-text whitespace-pre-wrap break-all">
                {form.content}
              </pre>
            )}

            {saveError && (
              <p className="m-0 text-[11px] text-red-600 dark:text-red-400">{saveError}</p>
            )}
          </>
        )}
      </div>

      {(running || reviewReady) && (
        <div className="flex items-center justify-end gap-1.5 px-2 py-2 border-t border-m3-border/70 bg-m3-sidebar/40">
          {running && (
            <button
              type="button"
              onClick={() => void cancel()}
              disabled={cancelling}
              className="inline-flex items-center gap-1 text-[11px] text-m3-secondary hover:text-m3-text px-2 py-1 rounded-sm hover:bg-m3-hover disabled:opacity-50"
            >
              {cancelling ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <X className="w-3 h-3" />
              )}
              {t("ai.chat.import.cancel")}
            </button>
          )}
          {reviewReady && (
            <button
              type="button"
              onClick={() => void save()}
              disabled={!form.title.trim() || saving || !canSave}
              className="inline-flex items-center gap-1 rounded-md bg-m3-primary text-white text-[11.5px] font-medium px-2.5 py-1.5 hover:opacity-90 disabled:opacity-40"
            >
              {saving ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Check className="w-3 h-3" />
              )}
              {t("ai.chat.import.saveSong")}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
