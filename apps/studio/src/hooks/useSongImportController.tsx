/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useSync } from "@/src/contexts/SyncContext";
import { useI18n } from "@/src/lib/i18n";
import {
  createLocalImportSink,
  describeImportProgress,
  isInteractiveImportProvider,
  songImportRegistry,
  type ProviderImportResult,
  type SongImportProvider,
} from "@/src/lib/import";
import React, { useCallback, useMemo, useState } from "react";

interface ActiveInteractiveSession {
  provider: SongImportProvider;
  data: unknown;
}

export function useSongImportController(options: {
  folderId: string | null;
  onImported?: () => void | Promise<void>;
  resolveFolderName?: () => string;
}) {
  const { t } = useI18n();
  const { showToast, updateToast, removeToast } = useSync();
  const [isUploading, setIsUploading] = useState(false);
  const [session, setSession] = useState<ActiveInteractiveSession | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const showToastImportResult = useCallback(
    (result: ProviderImportResult) => {
      if (result.created > 0) {
        showToast(
          t("layout.uploadSuccess", {
            count: result.created,
            type: result.fileTypeName,
            folder: options.resolveFolderName?.() ?? t("layout.rootDirectory"),
          }),
          "success",
        );
      }
      if (result.failed > 0) {
        showToast(
          t("layout.uploadError", {
            count: result.failed,
            type: result.fileTypeName,
          }),
          "error",
        );
      }
      if (result.ignored > 0) {
        showToast(
          t("layout.uploadIgnored", {
            count: result.ignored,
            type: result.fileTypeName,
          }),
          "warning",
        );
      }
    },
    [options, showToast, t],
  );

  const closeSession = useCallback(() => {
    if (isImporting) return;
    setSession(null);
    setProgress(null);
  }, [isImporting]);

  const confirmSession = useCallback(
    async (confirmOptions: unknown) => {
      if (!session || !isInteractiveImportProvider(session.provider)) return;
      const provider = session.provider;
      setIsImporting(true);
      setProgress({ done: 0, total: 1 });

      const progressToastId = showToast({
        type: "info",
        title:
          provider.getCommitProgressTitle?.(t) ??
          provider.getPrepareProgressTitle?.(t) ??
          t("layout.importProgressTitle"),
        description: t("layout.importProgressStarting"),
        duration: 0,
        progress: { value: 0, total: 1, indeterminate: true },
      });

      try {
        const sink = createLocalImportSink();
        const result = await provider.commit(session.data, confirmOptions, {
          songData: { folderId: options.folderId },
          sink,
          onProgress: (event) => {
            setProgress({
              done: Math.round(event.done),
              total: Math.max(1, Math.round(event.total)),
            });
            const next = describeImportProgress(event, t);
            updateToast(progressToastId, {
              description: next.description,
              progress: next.progress,
            });
          },
        });

        removeToast(progressToastId);
        const successMessage = provider.getSuccessMessage?.(result, t);
        if (successMessage) {
          showToast(successMessage, result.created > 0 ? "success" : "warning");
        } else {
          showToastImportResult(result);
        }
        if (result.failed > 0 && successMessage) {
          showToast(
            t("layout.uploadError", {
              count: result.failed,
              type: result.fileTypeName,
            }),
            "error",
          );
        }
        if (result.ignored > 0) {
          showToastImportResult({ ...result, created: 0, failed: 0 });
        }

        setSession(null);
        setProgress(null);
        await options.onImported?.();
      } catch (err) {
        removeToast(progressToastId);
        showToast(
          provider.getErrorMessage?.(err, t) ??
            (err instanceof Error ? err.message : t("layout.uploadErrorGeneric")),
          "error",
        );
      } finally {
        setIsImporting(false);
      }
    },
    [
      options,
      removeToast,
      session,
      showToast,
      showToastImportResult,
      t,
      updateToast,
    ],
  );

  const handleFiles = useCallback(
    async (fileList: File[]) => {
      if (!fileList.length) return;

      const progressToastId = showToast({
        type: "info",
        title: t("layout.importProgressTitle"),
        description: t("layout.importProgressStarting"),
        duration: 0,
        progress: { value: 0, total: 1, indeterminate: true },
      });

      try {
        const { interactive, direct } = await songImportRegistry.partitionFiles(fileList);
        let progressToastAlive = true;

        const bucket = interactive[0];
        if (bucket && isInteractiveImportProvider(bucket.provider)) {
          const provider = bucket.provider;
          updateToast(progressToastId, {
            title: provider.getPrepareProgressTitle?.(t) ?? t("layout.importProgressTitle"),
            description: t("layout.importProgressReading", {
              name: bucket.files[0]?.name ?? t("layout.importProgressFiles"),
            }),
            progress: { value: 0, total: 1, indeterminate: true },
          });

          try {
            const data = await provider.prepare(bucket.files, (event) => {
              const next = describeImportProgress(event, t);
              updateToast(progressToastId, {
                description: next.description,
                progress: next.progress,
              });
            });
            setSession({ provider, data });
            setProgress(null);
            removeToast(progressToastId);
            progressToastAlive = false;
            const ready = provider.getPreparedToast?.(data, t);
            if (ready) {
              showToast({
                type: "success",
                title: ready.title,
                description: ready.description,
                duration: 3500,
              });
            }
          } catch (err) {
            removeToast(progressToastId);
            progressToastAlive = false;
            showToast(
              provider.getErrorMessage?.(err, t) ??
                (err instanceof Error ? err.message : t("layout.uploadErrorGeneric")),
              "error",
            );
          }
        }

        if (direct.length === 0) return;

        setIsUploading(true);
        let activeToastId = progressToastId;
        if (!progressToastAlive) {
          activeToastId = showToast({
            type: "info",
            title: t("layout.importProgressTitle"),
            description: t("layout.importProgressStarting"),
            duration: 0,
            progress: { value: 0, total: 1, indeterminate: true },
          });
        } else {
          updateToast(activeToastId, {
            title: t("layout.importProgressTitle"),
            description: t("layout.importProgressStarting"),
            progress: { value: 0, total: 1, indeterminate: true },
          });
        }

        const result = await songImportRegistry.importFiles(direct, {
          songData: { folderId: options.folderId },
          sink: createLocalImportSink(),
          onProgress: (event) => {
            const next = describeImportProgress(event, t);
            updateToast(activeToastId, {
              description: next.description,
              progress: next.progress,
            });
          },
        });
        removeToast(activeToastId);
        result.results.forEach((r) => showToastImportResult(r));
        await options.onImported?.();
        setIsUploading(false);
      } catch (err) {
        removeToast(progressToastId);
        showToast(
          err instanceof Error ? err.message : t("layout.uploadErrorGeneric"),
          "error",
        );
        setIsUploading(false);
      }
    },
    [options, removeToast, showToast, showToastImportResult, t, updateToast],
  );

  const modal = useMemo(() => {
    if (!session || !isInteractiveImportProvider(session.provider)) return null;
    const Modal = session.provider.Modal;
    return (
      <Modal
        isOpen
        session={session.data}
        isImporting={isImporting}
        progress={progress}
        onClose={closeSession}
        onConfirm={confirmSession}
      />
    );
  }, [closeSession, confirmSession, isImporting, progress, session]);

  return {
    handleFiles,
    modal,
    isUploading,
    hasInteractiveSession: Boolean(session),
  };
}
