/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Modal } from "@hosanna/ui";
import { useI18n } from "@/src/lib/i18n";
import {
  summarizeSongbookSetlists,
  type SongbookBackupDocument,
  type SongbookImportOptions,
  type SongbookSetlistSummary,
} from "@/src/lib/import/songbook";
import type { InteractiveImportModalProps } from "@/src/lib/import/types";
import { CheckSquare, LibraryBig, Loader2, Square } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

export type SongbookImportModalProps = InteractiveImportModalProps<
  SongbookBackupDocument,
  SongbookImportOptions
>;

export const SongbookImportModal: React.FC<SongbookImportModalProps> = ({
  isOpen,
  session,
  isImporting = false,
  progress = null,
  onClose,
  onConfirm,
}) => {
  const { t } = useI18n();
  const setlists = useMemo<SongbookSetlistSummary[]>(
    () => (session ? summarizeSongbookSetlists(session) : []),
    [session],
  );

  const [alsoCreateCollections, setAlsoCreateCollections] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!isOpen || !session) return;
    setAlsoCreateCollections(false);
    setSelected(new Set(summarizeSongbookSetlists(session).map((s) => s.id)));
  }, [isOpen, session]);

  const selectedCount = selected.size;
  const selectedSongCount = useMemo(() => {
    if (!session) return 0;
    let count = 0;
    for (const song of session.songs) {
      const membership = song.folderIds.length > 0 ? song.folderIds : [0];
      if (membership.some((id) => selected.has(id))) count += 1;
    }
    return count;
  }, [session, selected]);

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
      selectedSetlistIds: [...selected],
      alsoCreateCollections,
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
              t("modals.songbookImport.importAction", { count: selectedSongCount })
            )}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <p className="text-sm text-m3-secondary leading-relaxed">
          {t("modals.songbookImport.description", {
            source: session?.sourceLabel ?? "SongbookPro",
            songs: session?.songs.length ?? 0,
          })}
        </p>

        <p className="text-[12px] text-m3-secondary leading-relaxed rounded-xl border border-m3-border bg-m3-sidebar/40 px-3 py-2.5">
          {t("modals.songbookImport.foldersAlwaysDesc")}
        </p>

        <button
          type="button"
          disabled={isImporting}
          onClick={() => setAlsoCreateCollections((v) => !v)}
          className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-colors cursor-pointer ${
            alsoCreateCollections
              ? "border-m3-primary bg-m3-primary/10"
              : "border-m3-border hover:bg-m3-hover"
          }`}
        >
          {alsoCreateCollections ? (
            <CheckSquare className="w-4 h-4 mt-0.5 text-m3-primary shrink-0" />
          ) : (
            <Square className="w-4 h-4 mt-0.5 text-m3-secondary shrink-0" />
          )}
          <LibraryBig className="w-4 h-4 mt-0.5 text-m3-primary shrink-0" />
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-m3-text">
              {t("modals.songbookImport.alsoCollections")}
            </span>
            <span className="block text-[11px] text-m3-secondary mt-0.5 leading-relaxed">
              {t("modals.songbookImport.alsoCollectionsDesc")}
            </span>
          </span>
        </button>

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
                {progress?.done ?? 0}/{progress?.total ?? selectedSongCount}
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
