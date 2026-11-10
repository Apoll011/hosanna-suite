/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Input, Modal } from "@hosanna/ui";
import { useI18n } from "@/src/lib/i18n";
import { Collection, Folder, Song } from "@/src/types";
import { ConversionResult } from "@hosanna/chordpro";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  HardDrive,
  Music,
  RotateCcw,
  Search,
  Sliders,
  Tag,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { emitOnboardingEvent } from "@/src/lib/tour";
import { FolderTreeNode, getFolderDescendantIds, MoveFolderTreeItem } from "../explorer";
import { FolderForm } from "../forms/FolderForm";
import { ServiceForm } from "../forms/ServiceForm";
import { SongForm } from "../forms/SongForm";
import { EventFormModal, EventFormValue } from "../agenda/EventModals";
import { AddToCollectionModal } from "../modals/AddToCollectionModal";
import { BatchDeleteModal } from "../modals/BatchDeleteModal";
import { BatchMoveModal } from "../modals/BatchMoveModal";
import { BatchTagModal } from "../modals/BatchTagModal";
import { ThirdPartyProvidersModal } from "../modals/ThirdPartyProvidersModal";
import { CreateCollectionModal } from "../modals/CreateCollectionModal";
import { CustomizeFolderModal } from "../modals/CustomizeFolderModal";
import { MoveSongModal } from "../modals/MoveSongModal";

export type ActiveModal =
  | "cifra-import"
  | "create-song"
  | "create-service"
  | "create-folder"
  | "create-event"
  | "create-collection"
  | "filter"
  | "batch-move"
  | "batch-delete"
  | "batch-tag"
  | "batch-add-to-collection"
  | null;

const MUSICAL_KEYS = [
  "C",
  "C#",
  "Db",
  "D",
  "D#",
  "Eb",
  "E",
  "F",
  "F#",
  "Gb",
  "G",
  "G#",
  "Ab",
  "A",
  "A#",
  "Bb",
  "B",
  "Am",
  "Bm",
  "Cm",
  "Dm",
  "Em",
  "Fm",
  "Gm",
];

function addLiqeClause(query: string, clause: string): string {
  const trimmed = query.trim();
  if (!trimmed) return clause;
  if (trimmed.includes(clause)) {
    return trimmed
      .replace(clause, "")
      .replace(/\s+AND\s+/g, " AND ")
      .replace(/^\s*AND\s+|\s+AND\s*$/g, "")
      .trim();
  }
  return `${trimmed} AND ${clause}`;
}

function removeLiqeClause(query: string, prefix: string): string {
  return query
    .split(/\s+AND\s+/i)
    .filter((part) => !part.trim().toLowerCase().startsWith(prefix.toLowerCase()))
    .join(" AND ")
    .trim();
}

function hasClause(query: string, clause: string): boolean {
  return query.includes(clause);
}

function getClauseValue(query: string, field: string): string | null {
  const regex = new RegExp(`\\b${field}:([^\\s]+|"[^"]*")`, "i");
  const match = query.match(regex);
  return match ? match[1].replace(/"/g, "") : null;
}

const FilterSection: React.FC<{
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ icon, label, active, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-m3-border rounded-2xl overflow-hidden bg-m3-card/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-m3-text hover:bg-m3-hover transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span className={active ? "text-m3-primary" : "text-m3-secondary"}>{icon}</span>
          <span className={active ? "text-m3-primary" : ""}>{label}</span>
          {active && <span className="w-2 h-2 rounded-full bg-m3-primary inline-block" />}
        </div>
        {open ? (
          <ChevronDown className="w-3.5 h-3.5 text-m3-secondary" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-m3-secondary" />
        )}
      </button>
      {open && <div className="px-4 pb-4 pt-1 border-t border-m3-border/50">{children}</div>}
    </div>
  );
};

const Chip: React.FC<{
  label: string;
  selected?: boolean;
  onClick: () => void;
}> = ({ label, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer border transition-all ${
      selected
        ? "bg-m3-primary text-white border-m3-primary shadow-sm shadow-m3-primary/30"
        : "bg-m3-card text-m3-secondary border-m3-border hover:border-m3-primary/50 hover:text-m3-primary"
    }`}
  >
    {label}
  </button>
);

interface AdvancedFilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentQuery: string;
  onApplyQuery: (query: string) => void;
  availableTags: string[];
  availableFolders: Folder[];
  currentFolder?: Folder;
}

const AdvancedFilterPanel: React.FC<AdvancedFilterPanelProps> = ({
  isOpen,
  onClose,
  currentQuery,
  onApplyQuery,
  availableTags,
  availableFolders,
  currentFolder,
}) => {
  const { t } = useI18n();

  const [draft, setDraft] = useState(currentQuery);

  React.useEffect(() => {
    if (isOpen) setDraft(currentQuery);
  }, [isOpen, currentQuery]);

  const activeTags = useMemo(
    () =>
      availableTags.filter((tag) =>
        hasClause(draft, `tags:${tag.includes(" ") ? `"${tag}"` : tag}`),
      ),
    [draft, availableTags],
  );
  const activeKey = useMemo(() => getClauseValue(draft, "key"), [draft]);
  const activeFolder = useMemo(() => getClauseValue(draft, "folder"), [draft]);

  const toggleTag = useCallback((tag: string) => {
    const clause = tag.includes(" ") ? `tags:"${tag}"` : `tags:${tag}`;
    setDraft((q) =>
      hasClause(q, clause)
        ? removeLiqeClause(q, `tags:${tag.includes(" ") ? `"${tag}"` : tag}`)
        : addLiqeClause(q, clause),
    );
  }, []);

  const toggleKey = useCallback((key: string) => {
    setDraft((q) => {
      const existing = getClauseValue(q, "key");
      const cleaned = removeLiqeClause(q, "key:");
      if (existing === key) return cleaned; // deselect
      return addLiqeClause(cleaned, `key:${key}`);
    });
  }, []);

  const toggleFolder = useCallback((folderName: string) => {
    setDraft((q) => {
      const existing = getClauseValue(q, "folder");
      const cleaned = removeLiqeClause(q, "folder:");
      if (existing === folderName) return cleaned;
      return addLiqeClause(
        cleaned,
        folderName.includes(" ") ? `folder:"${folderName}"` : `folder:${folderName}`,
      );
    });
  }, []);

  const handleApply = useCallback(() => {
    onApplyQuery(draft);
    onClose();
  }, [draft, onApplyQuery, onClose]);

  const handleClear = useCallback(() => {
    setDraft("");
  }, []);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t("explorer.modals.filterTitle")}>
      <div className="space-y-3 py-2 max-h-[70vh] overflow-y-auto">
        <div className="flex items-center gap-2 p-3 bg-m3-sidebar/40 border border-m3-border rounded-2xl">
          <Search className="w-3.5 h-3.5 text-m3-secondary shrink-0" />
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Liqe query preview — edit freely…"
            className="flex-1 bg-transparent text-xs text-m3-text placeholder:text-m3-secondary/60 outline-none font-mono"
            spellCheck={false}
          />
          {draft && (
            <button
              type="button"
              onClick={() => setDraft("")}
              className="text-m3-secondary hover:text-m3-text transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {currentFolder && (
          <p className="text-[11px] text-m3-secondary px-1">
            {t("explorer.modals.searchScope")}{" "}
            <span className="font-bold text-m3-primary">{currentFolder.name}</span>
          </p>
        )}

        {availableTags.length > 0 && (
          <FilterSection
            icon={<Tag className="w-3.5 h-3.5" />}
            label={t("explorer.modals.categoryTag")}
            active={activeTags.length > 0}
            defaultOpen={activeTags.length > 0}
          >
            <div className="flex flex-wrap gap-1.5 mt-2 max-h-28 overflow-y-auto">
              {availableTags.map((tag) => {
                const clause = tag.includes(" ") ? `tags:"${tag}"` : `tags:${tag}`;
                return (
                  <Chip
                    key={tag}
                    label={tag}
                    selected={hasClause(draft, clause)}
                    onClick={() => toggleTag(tag)}
                  />
                );
              })}
            </div>
          </FilterSection>
        )}

        <FilterSection
          icon={<Music className="w-3.5 h-3.5" />}
          label="Tonalidade / Key"
          active={!!activeKey}
          defaultOpen={!!activeKey}
        >
          <div className="flex flex-wrap gap-1.5 mt-2">
            {MUSICAL_KEYS.map((key) => (
              <Chip
                key={key}
                label={key}
                selected={activeKey === key}
                onClick={() => toggleKey(key)}
              />
            ))}
          </div>
        </FilterSection>

        {availableFolders.length > 0 && (
          <FilterSection
            icon={<HardDrive className="w-3.5 h-3.5" />}
            label="Pasta / Folder"
            active={!!activeFolder}
            defaultOpen={!!activeFolder}
          >
            <div className="flex flex-wrap gap-1.5 mt-2 max-h-32 overflow-y-auto">
              {availableFolders.map((folder) => (
                <Chip
                  key={folder.id}
                  label={folder.name}
                  selected={activeFolder === folder.name}
                  onClick={() => toggleFolder(folder.name)}
                />
              ))}
            </div>
          </FilterSection>
        )}

        <FilterSection
          icon={<Search className="w-3.5 h-3.5" />}
          label="Pesquisa por campo / Field search"
          active={
            hasClause(draft, "title:") ||
            hasClause(draft, "artist:") ||
            hasClause(draft, "content:") ||
            hasClause(draft, "tempo:") ||
            hasClause(draft, "year:")
          }
        >
          <div className="mt-2 space-y-2">
            <p className="text-[11px] text-m3-secondary leading-relaxed">
              Clique num campo para adicionar um prefixo de pesquisa ao query. <br />
              Edite o valor diretamente no campo de query acima.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  ["title", "Título"],
                  ["artist", "Artista"],
                  ["content", "Letra / Conteúdo"],
                  ["year", "Ano"],
                  ["tempo", "Tempo (BPM)"],
                  ["album", "Álbum"],
                  ["composer", "Compositor"],
                  ["ccli", "CCLI"],
                ] as const
              ).map(([field, label]) => (
                <button
                  key={field}
                  type="button"
                  onClick={() =>
                    setDraft((q) => {
                      const base = q.trim();
                      const prefix = base ? `${base} AND ${field}:` : `${field}:`;
                      return prefix;
                    })
                  }
                  className="px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer border transition-all bg-m3-card text-m3-secondary border-m3-border hover:border-m3-primary/50 hover:text-m3-primary"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </FilterSection>

        <FilterSection
          icon={<Sliders className="w-3.5 h-3.5" />}
          label="Intervalos / Ranges"
          active={
            hasClause(draft, "year:[") ||
            hasClause(draft, "tempo:[") ||
            hasClause(draft, "duration:[")
          }
        >
          <div className="mt-2 space-y-2">
            <p className="text-[11px] text-m3-secondary">
              Presets rápidos — clicar adiciona o intervalo ao query.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  ["Clássicos (< 1980)", "year:[* TO 1979]"],
                  ["Anos 80–90", "year:[1980 TO 1999]"],
                  ["Anos 2000+", "year:[2000 TO *]"],
                  ["Lento (< 80 BPM)", "tempo:[* TO 79]"],
                  ["Moderado (80–120)", "tempo:[80 TO 120]"],
                  ["Rápido (> 120)", "tempo:[121 TO *]"],
                  ["Curto (< 3 min)", "duration:[* TO 179]"],
                  ["Longo (> 5 min)", "duration:[300 TO *]"],
                ] as const
              ).map(([label, clause]) => (
                <button
                  key={clause}
                  type="button"
                  onClick={() => setDraft((q) => addLiqeClause(q, clause))}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer border transition-all ${
                    hasClause(draft, clause)
                      ? "bg-m3-primary text-white border-m3-primary"
                      : "bg-m3-card text-m3-secondary border-m3-border hover:border-m3-primary/50 hover:text-m3-primary"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </FilterSection>
      </div>

      <div className="flex items-center justify-between pt-4 mt-2 border-t border-m3-border">
        <button
          type="button"
          onClick={handleClear}
          className="flex items-center gap-1.5 text-xs font-semibold text-m3-secondary hover:text-m3-text transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {t("explorer.modals.clearFilters")}
        </button>

        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={handleApply}>
            {t("explorer.modals.applyFilters")}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

interface ExplorerModalsProps {
  activeModal: ActiveModal;
  onCloseModal: () => void;
  onOpenModal?: (modal: ActiveModal) => void;

  onCifraClubSubmit: (chordpro: ConversionResult, artist: string, title: string) => Promise<void>;

  currentFolder: Folder | undefined;
  currentFolderId: string | null;
  allFolders?: Folder[];
  onCreateSongSubmit: (data: {
    title: string;
    artist: string;
    folderId: string | null;
    tags: string[];
  }) => Promise<void>;

  onCreateServiceSubmit: (data: { name: string; date: string; notes: string }) => Promise<void>;

  onCreateEventSubmit?: (value: EventFormValue) => Promise<void>;

  onCreateFolderSubmit: (name: string) => Promise<void>;

  renameTarget: Folder | null;
  setRenameTarget: (f: Folder | null) => void;
  onRenameFolderSubmit: (name: string) => Promise<void>;

  customizeTarget?: Folder | null;
  setCustomizeTarget?: (f: Folder | null) => void;
  onCustomizeFolderSubmit?: (color: string, icon: string) => Promise<void>;

  moveFolderTarget: Folder | null;
  setMoveFolderTarget: (f: Folder | null) => void;
  targetParentFolderId: string | null;
  setTargetParentFolderId: (id: string | null) => void;
  folderTree: FolderTreeNode[];
  expandedFolderIds: Set<string>;
  toggleExpand: (id: string) => void;
  onMoveFolderSubmit: () => Promise<void>;

  deleteTarget: Folder | null;
  setDeleteTarget: (f: Folder | null) => void;
  deleteAcao: "move_to_root" | "delete_songs";
  setDeleteAcao: (a: "move_to_root" | "delete_songs") => void;
  confirmFolderName: string;
  setConfirmFolderName: (n: string) => void;
  onDeleteFolderSubmit: () => Promise<void>;

  moveSongTarget: Song | null;
  setMoveSongTarget: (s: Song | null) => void;
  targetSongFolderId: string | null;
  onMoveSongConfirm: (targetFolderId: string | null) => Promise<void>;

  deleteSongTarget: Song | null;
  setDeleteSongTarget: (s: Song | null) => void;
  onDeleteSongSubmit: () => Promise<void>;

  selectedFolderIds: Set<string>;
  selectedSongIds: Set<string>;
  disabledFolderIdsForBatchMove: Set<string>;
  onBatchMoveConfirm: (targetFolderId: string | null) => Promise<void>;

  selectedFolderObjects: Folder[];
  onBatchDeleteConfirm: (folderAction: "move_to_root" | "delete_songs") => Promise<void>;

  onBatchTagConfirm: (tags: string[], mode: "append" | "replace" | "remove") => Promise<void>;

  currentQuery: string;
  onApplyQuery: (query: string) => void;
  availableTags: string[];

  onCreateCollectionSubmit?: (data: {
    name: string;
    description?: string | null;
    color?: string;
    icon?: string;
    image?: string | null;
  }) => Promise<void>;

  addToCollectionTarget?: Song | null;
  setAddToCollectionTarget?: (s: Song | null) => void;
  allCollections?: Collection[];
  onAddToCollectionConfirm?: (collectionId: string) => Promise<void>;
  onOpenCreateCollectionFromAdd?: () => void;
}

export const ExplorerModals: React.FC<ExplorerModalsProps> = ({
  activeModal,
  onCloseModal,
  onOpenModal,
  onCifraClubSubmit,
  currentFolder,
  currentFolderId,
  allFolders = [],
  onCreateSongSubmit,
  onCreateServiceSubmit,
  onCreateEventSubmit,
  onCreateFolderSubmit,
  renameTarget,
  setRenameTarget,
  onRenameFolderSubmit,
  customizeTarget,
  setCustomizeTarget,
  onCustomizeFolderSubmit,
  moveFolderTarget,
  setMoveFolderTarget,
  targetParentFolderId,
  setTargetParentFolderId,
  folderTree,
  expandedFolderIds,
  toggleExpand,
  onMoveFolderSubmit,
  deleteTarget,
  setDeleteTarget,
  deleteAcao,
  setDeleteAcao,
  confirmFolderName,
  setConfirmFolderName,
  onDeleteFolderSubmit,
  moveSongTarget,
  setMoveSongTarget,
  targetSongFolderId,
  onMoveSongConfirm,
  deleteSongTarget,
  setDeleteSongTarget,
  onDeleteSongSubmit,
  selectedFolderIds,
  selectedSongIds,
  disabledFolderIdsForBatchMove,
  onBatchMoveConfirm,
  selectedFolderObjects,
  onBatchDeleteConfirm,
  onBatchTagConfirm,
  currentQuery,
  onApplyQuery,
  availableTags,
  onCreateCollectionSubmit,
  addToCollectionTarget,
  setAddToCollectionTarget,
  allCollections = [],
  onAddToCollectionConfirm,
  onOpenCreateCollectionFromAdd,
}) => {
  const { t } = useI18n();

  useEffect(() => {
    if (activeModal === "create-folder") {
      emitOnboardingEvent("create-folder-modal-opened");
    } else if (activeModal === "create-song") {
      emitOnboardingEvent("create-song-modal-opened");
    } else if (activeModal === "create-service") {
      emitOnboardingEvent("create-service-modal-opened");
    } else if (activeModal === "create-collection") {
      emitOnboardingEvent("create-collection-modal-opened");
    } else if (activeModal === "create-event") {
      emitOnboardingEvent("create-event-modal-opened");
    }
  }, [activeModal]);

  return (
    <>
      <ThirdPartyProvidersModal
        isOpen={activeModal === "cifra-import"}
        handleClose={onCloseModal}
        handleSave={onCifraClubSubmit}
      />

      <Modal
        isOpen={activeModal === "create-song"}
        onClose={onCloseModal}
        dataTour="create-song-modal"
        title={
          currentFolder
            ? t("explorer.modals.createSongInFolder", {
                folder: currentFolder.name,
              })
            : t("explorer.modals.createSongInRoot")
        }
      >
        <SongForm
          initialValues={{ folderId: currentFolderId }}
          folders={allFolders}
          onSubmit={onCreateSongSubmit}
          onCancel={onCloseModal}
        />
      </Modal>

      <Modal
        isOpen={activeModal === "create-service"}
        onClose={onCloseModal}
        dataTour="create-service-modal"
        title={t("explorer.modals.createServiceTitle")}
      >
        <ServiceForm onSubmit={onCreateServiceSubmit} onCancel={onCloseModal} />
      </Modal>

      {onCreateEventSubmit && (
        <EventFormModal
          isOpen={activeModal === "create-event"}
          onClose={onCloseModal}
          onSubmit={onCreateEventSubmit}
          title={t("agenda.newEvent")}
          submitLabel={t("agenda.createEvent")}
        />
      )}

      <Modal
        isOpen={activeModal === "create-folder"}
        onClose={onCloseModal}
        dataTour="create-folder-modal"
        title={
          currentFolder
            ? t("explorer.modals.createFolderInFolder", {
                folder: currentFolder.name,
              })
            : t("explorer.modals.createFolderInRoot")
        }
      >
        <FolderForm onSubmit={onCreateFolderSubmit} onCancel={onCloseModal} />
      </Modal>

      <Modal
        isOpen={!!renameTarget}
        onClose={() => setRenameTarget(null)}
        title={t("explorer.modals.renameFolderTitle", {
          folder: renameTarget?.name || "",
        })}
      >
        <FolderForm
          initialName={renameTarget?.name || ""}
          title={t("explorer.modals.updateFolderName")}
          onSubmit={onRenameFolderSubmit}
          onCancel={() => setRenameTarget(null)}
        />
      </Modal>

      {customizeTarget && setCustomizeTarget && onCustomizeFolderSubmit && (
        <CustomizeFolderModal
          isOpen={!!customizeTarget}
          folder={customizeTarget}
          onClose={() => setCustomizeTarget(null)}
          onSave={onCustomizeFolderSubmit}
        />
      )}

      <Modal
        isOpen={!!moveFolderTarget}
        onClose={() => setMoveFolderTarget(null)}
        title={t("explorer.modals.moveFolderTitle", {
          folder: moveFolderTarget?.name || "",
        })}
      >
        <div className="flex flex-col gap-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t("explorer.modals.selectDestFolder")}{" "}
            <strong className="text-slate-900 dark:text-slate-100">{moveFolderTarget?.name}</strong>
            :
          </p>

          <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
            <label className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <input
                type="radio"
                name="targetFolderParent"
                value="root"
                checked={targetParentFolderId === null}
                onChange={() => setTargetParentFolderId(null)}
                className="text-m3-primary focus:ring-m3-primary"
              />
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                <HardDrive className="w-4 h-4 text-m3-primary" />
                <span>{t("explorer.modals.rootTopLevel")}</span>
              </div>
            </label>

            <div className="flex flex-col gap-1.5 mt-1">
              {folderTree.map((node) => (
                <MoveFolderTreeItem
                  key={node.folder.id}
                  node={node}
                  selectedFolderId={targetParentFolderId}
                  onSelect={setTargetParentFolderId}
                  disabledFolderIds={
                    moveFolderTarget
                      ? getFolderDescendantIds(moveFolderTarget.id, allFolders)
                      : undefined
                  }
                  expandedFolderIds={expandedFolderIds}
                  toggleExpand={toggleExpand}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" onClick={() => setMoveFolderTarget(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="primary" onClick={onMoveFolderSubmit}>
              {t("explorer.modals.moveFolderBtn")}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => {
          setDeleteTarget(null);
          setConfirmFolderName("");
          setDeleteAcao("move_to_root");
        }}
        title={t("explorer.modals.deleteFolderTitle", {
          folder: deleteTarget?.name || "",
        })}
      >
        {(deleteTarget?.folderCount || 0) + (deleteTarget?.songCount || 0) > 0 ? (
          <div className="flex flex-col gap-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
              <span>{t("explorer.modals.selectDeleteFolderOption")}</span>
            </div>

            <div className="flex flex-col gap-2.5">
              <label className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <input
                  type="radio"
                  name="deleteAcao"
                  value="move_to_root"
                  checked={deleteAcao === "move_to_root"}
                  onChange={() => {
                    setDeleteAcao("move_to_root");
                    setConfirmFolderName("");
                  }}
                  className="text-m3-primary focus:ring-m3-primary"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {t("explorer.modals.moveContentsToRoot")}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {t("explorer.modals.moveContentsToRootDesc")}
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-rose-200 dark:border-rose-950 rounded-xl cursor-pointer hover:bg-rose-50/50 dark:hover:bg-rose-950/20">
                <input
                  type="radio"
                  name="deleteAcao"
                  value="delete_songs"
                  checked={deleteAcao === "delete_songs"}
                  onChange={() => setDeleteAcao("delete_songs")}
                  className="text-rose-600 focus:ring-rose-500"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                    {t("explorer.modals.deleteFolderAndContents")}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {t("explorer.modals.deleteFolderAndContentsDesc")}
                  </span>
                </div>
              </label>
            </div>

            {deleteAcao === "delete_songs" && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl flex flex-col gap-3 text-xs">
                <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-300">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{t("explorer.modals.additionalSecurity")}</span>
                </div>
                <p className="text-rose-900 dark:text-rose-200 text-[11px] leading-relaxed">
                  {t("explorer.modals.deleteFolderIrreversible")}{" "}
                  <strong className="font-extrabold underline">{deleteTarget?.name}</strong> abaixo:
                </p>
                <Input
                  placeholder={t("explorer.modals.writeToConfirm", {
                    name: deleteTarget?.name || "",
                  })}
                  value={confirmFolderName}
                  onChange={(e) => setConfirmFolderName(e.target.value)}
                  className="bg-white dark:bg-slate-900 border-rose-300 dark:border-rose-800 text-xs"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="ghost"
                onClick={() => {
                  setDeleteTarget(null);
                  setConfirmFolderName("");
                  setDeleteAcao("move_to_root");
                }}
              >
                {t("common.cancel")}
              </Button>
              <Button
                variant="danger"
                disabled={
                  deleteAcao === "delete_songs" &&
                  confirmFolderName.trim() !== deleteTarget?.name?.trim()
                }
                onClick={onDeleteFolderSubmit}
              >
                {t("explorer.modals.confirmDelete")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2.5">
              <label className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {t("explorer.modals.emptyFolderDelete")}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {t("explorer.modals.emptyFolderDeleteDesc")}
                  </span>
                </div>
              </label>

              <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setDeleteTarget(null);
                    setConfirmFolderName("");
                    setDeleteAcao("move_to_root");
                  }}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  variant="danger"
                  disabled={
                    deleteAcao === "delete_songs" &&
                    confirmFolderName.trim() !== deleteTarget?.name?.trim()
                  }
                  onClick={onDeleteFolderSubmit}
                >
                  {t("explorer.modals.confirmDelete")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <MoveSongModal
        isOpen={!!moveSongTarget}
        onClose={() => setMoveSongTarget(null)}
        songTitle={moveSongTarget?.title}
        initialFolderId={targetSongFolderId}
        folders={allFolders}
        onConfirm={onMoveSongConfirm}
      />

      <Modal
        isOpen={!!deleteSongTarget}
        onClose={() => setDeleteSongTarget(null)}
        title={t("explorer.modals.deleteSongTitle", {
          title: deleteSongTarget?.title || "",
        })}
      >
        <div className="flex flex-col gap-4">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <span>
              {t("explorer.modals.deleteSongWarning", {
                title: deleteSongTarget?.title || "",
              })}
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 mt-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" onClick={() => setDeleteSongTarget(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="danger" onClick={onDeleteSongSubmit}>
              {t("explorer.modals.deleteSongBtn")}
            </Button>
          </div>
        </div>
      </Modal>

      <BatchMoveModal
        isOpen={activeModal === "batch-move"}
        onClose={onCloseModal}
        selectedFoldersCount={selectedFolderIds.size}
        selectedSongsCount={selectedSongIds.size}
        disabledFolderIds={disabledFolderIdsForBatchMove}
        folders={allFolders}
        onConfirm={onBatchMoveConfirm}
      />

      <BatchDeleteModal
        isOpen={activeModal === "batch-delete"}
        onClose={onCloseModal}
        selectedFolders={selectedFolderObjects}
        selectedSongsCount={selectedSongIds.size}
        onConfirm={onBatchDeleteConfirm}
      />

      <BatchTagModal
        isOpen={activeModal === "batch-tag"}
        onClose={onCloseModal}
        selectedSongIds={Array.from(selectedSongIds)}
        onConfirm={onBatchTagConfirm}
      />

      <AdvancedFilterPanel
        isOpen={activeModal === "filter"}
        onClose={onCloseModal}
        currentQuery={currentQuery}
        onApplyQuery={onApplyQuery}
        availableTags={availableTags}
        availableFolders={allFolders}
        currentFolder={currentFolder}
      />

      {onCreateCollectionSubmit && (
        <CreateCollectionModal
          isOpen={activeModal === "create-collection"}
          onClose={onCloseModal}
          onSave={onCreateCollectionSubmit}
        />
      )}

      {addToCollectionTarget && setAddToCollectionTarget && onAddToCollectionConfirm && (
        <AddToCollectionModal
          isOpen={!!addToCollectionTarget}
          onClose={() => setAddToCollectionTarget(null)}
          collections={allCollections}
          songTitle={addToCollectionTarget.title}
          onConfirm={onAddToCollectionConfirm}
          onCreateNewCollection={
            onOpenModal ? () => onOpenModal("create-collection") : onOpenCreateCollectionFromAdd
          }
        />
      )}

      {onAddToCollectionConfirm && (
        <AddToCollectionModal
          isOpen={activeModal === "batch-add-to-collection"}
          onClose={onCloseModal}
          collections={allCollections}
          songCount={selectedSongIds.size}
          onConfirm={onAddToCollectionConfirm}
          onCreateNewCollection={
            onOpenModal ? () => onOpenModal("create-collection") : onOpenCreateCollectionFromAdd
          }
        />
      )}
    </>
  );
};
