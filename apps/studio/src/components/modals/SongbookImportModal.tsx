/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Modal } from "@hosanna/ui";
import { useI18n } from "@/src/lib/i18n";
import type {
  SongbookBackupDocument,
  SongbookPlacementMode,
  SongbookSetlistSummary,
} from "@/src/lib/import";
import { summarizeSongbookSetlists } from "@/src/lib/import";
import { CheckSquare, FolderTree, LibraryBig, Loader2, Square } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

export interface SongbookImportModalProps {
  isOpen: boolean;
  document: SongbookBackupDocument | null;
  isImporting?: boolean;
  progress?: { done: number; total: number } | null;
  onClose: () => void;
  onConfirm: (options: {
    mode: SongbookPlacementMode;
    selectedSetlistIds: number[];
  }) => Promise<void> | void;
}

export const SongbookImportModal: React.FC<SongbookImportModalProps> = ({
  isOpen,
  document,
  isImporting = false,
  progress = null,
  onClose,
  onConfirm,
}) => {
  const { t } = useI18n();
  const setlists = useMemo<SongbookSetlistSummary[]>(
    () => (document ? summarizeSongbookSetlists(document) : []),
    [document],
  );

  const [mode, setMode] = useState<SongbookPlacementMode>("folders");
  const [selected, setSelected] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!isOpen || !document) return;
    setMode("folders");
    setSelected(new Set(summarizeSongbookSetlists(document).map((s) => s.id)));
  }, [isOpen, document]);

  const selectedCount = selected.size;
  const selectedSongEstimate = useMemo(() => {
    if (!document) return 0;
    const ids = new Set<number>();
    for (const song of document.songs) {
      const membership = song.folderIds.length > 0 ? song.folderIds : [0];
      if (mode === "folders") {
        const primary = membership.find((id) => selected.has(id));
        if (primary !== undefined) ids.add(song.id);
      } else if (membership.some((id) => selected.has(id))) {
        ids.add(song.id);
      }
    }
    return ids.size;
  }, [document, mode, selected]);

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(setlists.map((s) => s.id)));
  const selectNone = () => setSelected(new Set());

  const handleConfirm = async () => {
    if (selectedCount === 0 || isImporting) return;
    await onConfirm({
      mode,
      selectedSetlistIds: [...selected],
    });
  };

  const progressPct =
    progress && progress.total > 0
      ? Math.min(100, Math.round((progress.done / progress.total) * 100))
      : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isImporting) onClose();
      }}
      title={t("modals.songbookImport.title")}
      maxWidth="xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isImporting}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleConfirm} disabled={selectedCount === 0 || isImporting}>
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("modals.songbookImport.importing")}
              </>
            ) : (
              t("modals.songbookImport.importAction", { count: selectedSongEstimate })
            )}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <p className="text-sm text-m3-secondary leading-relaxed">
          {t("modals.songbookImport.description", {
            source: document?.sourceLabel ?? "SongbookPro",
            songs: document?.songs.length ?? 0,
          })}
        </p>

        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold uppercase tracking-wide text-m3-secondary">
            {t("modals.songbookImport.placementLegend")}
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isImporting}
              onClick={() => setMode("folders")}
              className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                mode === "folders"
                  ? "border-m3-primary bg-m3-primary/10"
                  : "border-m3-border hover:bg-m3-hover"
              }`}
            >
              <FolderTree className="w-4 h-4 mt-0.5 text-m3-primary shrink-0" />
              <span>
                <span className="block text-sm font-semibold text-m3-text">
                  {t("modals.songbookImport.asFolders")}
                </span>
                <span className="block text-[11px] text-m3-secondary mt-0.5 leading-relaxed">
                  {t("modals.songbookImport.asFoldersDesc")}
                </span>
              </span>
            </button>
            <button
              type="button"
              disabled={isImporting}
              onClick={() => setMode("collections")}
              className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                mode === "collections"
                  ? "border-m3-primary bg-m3-primary/10"
                  : "border-m3-border hover:bg-m3-hover"
              }`}
            >
              <LibraryBig className="w-4 h-4 mt-0.5 text-m3-primary shrink-0" />
              <span>
                <span className="block text-sm font-semibold text-m3-text">
                  {t("modals.songbookImport.asCollections")}
                </span>
                <span className="block text-[11px] text-m3-secondary mt-0.5 leading-relaxed">
                  {t("modals.songbookImport.asCollectionsDesc")}
                </span>
              </span>
            </button>
          </div>
        </fieldset>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-m3-secondary">
              {t("modals.songbookImport.setlistsLegend")}
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isImporting}
                onClick={selectAll}
                className="text-[11px] font-medium text-m3-primary hover:underline cursor-pointer"
              >
                {t("modals.songbookImport.selectAll")}
              </button>
              <span className="text-m3-border">·</span>
              <button
                type="button"
                disabled={isImporting}
                onClick={selectNone}
                className="text-[11px] font-medium text-m3-primary hover:underline cursor-pointer"
              >
                {t("modals.songbookImport.selectNone")}
              </button>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto rounded-xl border border-m3-border divide-y divide-m3-border">
            {setlists.map((setlist) => {
              const checked = selected.has(setlist.id);
              return (
                <button
                  key={setlist.id}
                  type="button"
                  disabled={isImporting}
                  onClick={() => toggle(setlist.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-m3-hover transition-colors cursor-pointer disabled:cursor-default"
                >
                  {checked ? (
                    <CheckSquare className="w-4 h-4 text-m3-primary shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-m3-secondary shrink-0" />
                  )}
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-m3-text truncate">
                      {setlist.name}
                    </span>
                  </span>
                  <span className="text-[11px] text-m3-secondary shrink-0">
                    {t("modals.songbookImport.songCount", { count: setlist.songCount })}
                  </span>
                </button>
              );
            })}
            {setlists.length === 0 && (
              <div className="px-3 py-6 text-center text-sm text-m3-secondary">
                {t("modals.songbookImport.noSetlists")}
              </div>
            )}
          </div>
        </div>

        {isImporting && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-m3-secondary">
              <span>{t("modals.songbookImport.progressLabel")}</span>
              <span>
                {progress?.done ?? 0}/{progress?.total ?? selectedSongEstimate}
              </span>
            </div>
            <div className="h-2 rounded-full bg-m3-border overflow-hidden">
              <div
                className="h-full bg-m3-primary transition-all duration-200"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
