/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Badge } from "@/src/components/common";
import { useI18n } from "@/src/lib/i18n";
import { Folder, Song } from "@/src/types";
import {
  ArrowRightLeft,
  CheckSquare,
  Edit2,
  ExternalLink,
  FolderOpen,
  FolderPlus,
  Move,
  Palette,
  Plus,
  Printer,
  RotateCw,
  Tag,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import React from "react";
import { Can, CanAll } from "../../lib/permissions/components";
import { ActiveModal } from "./ExplorerModals";

export interface ContextMenuState {
  x: number;
  y: number;
  type: "folder" | "song" | "canvas";
  item?: Folder | Song | null;
}

export interface ExplorerContextMenuProps {
  contextMenu: ContextMenuState | null;
  currentFolder: Folder | undefined;
  totalSelectedCount: number;
  selectedSongIds: Set<string>;
  selectedFolderIds: Set<string>;
  slugPrefix: string;
  navigate: (path: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onClose: () => void;
  onOpenModal: (modal: ActiveModal) => void;
  onSelectAll: () => void;
  onRefreshView: () => void;
  onClearSelection: () => void;
  onSelectFolder: (id: string) => void;
  onCustomizeFolder?: (folder: Folder) => void;
  onRenameFolder: (folder: Folder) => void;
  onMoveFolder: (folder: Folder) => void;
  onDeleteFolder: (folder: Folder) => void;
  onMoveSong: (song: Song) => void;
  onTagSong: (song: Song) => void;
  onAddToCollection?: (song: Song) => void;
  onDeleteSong: (song: Song) => void;
  onPrintSongs?: () => void;
  onPrintFolders?: () => void;
  onPrintSong?: (id: string) => void;
  onPrintFolder?: (id: string) => void;
}

const MENU_ITEM =
  "w-full flex items-center gap-2.5 px-3 py-2 min-h-10 rounded-[var(--radius-md)] text-m3-text hover:bg-m3-hover font-medium transition-colors text-left cursor-pointer";
const MENU_ITEM_DANGER =
  "w-full flex items-center gap-2.5 px-3 py-2 min-h-10 rounded-[var(--radius-md)] text-m3-danger hover:bg-m3-danger/10 font-semibold transition-colors text-left cursor-pointer";
const MENU_ICON = "w-4 h-4 text-m3-secondary";
const MENU_HEADER =
  "px-3 py-1.5 text-label border-b border-m3-border mb-0.5 truncate flex items-center justify-between";

export const ExplorerContextMenu: React.FC<ExplorerContextMenuProps> = ({
  contextMenu,
  currentFolder,
  totalSelectedCount,
  selectedSongIds,
  selectedFolderIds,
  slugPrefix,
  navigate,
  fileInputRef,
  onClose,
  onOpenModal,
  onSelectAll,
  onRefreshView,
  onClearSelection,
  onSelectFolder,
  onCustomizeFolder,
  onRenameFolder,
  onMoveFolder,
  onDeleteFolder,
  onMoveSong,
  onTagSong,
  onAddToCollection,
  onDeleteSong,
  onPrintSongs,
  onPrintFolders,
  onPrintSong,
  onPrintFolder,
}) => {
  const { t } = useI18n();

  if (!contextMenu) return null;

  return (
    <div
      data-tour="explorer-context-menu"
      style={{ top: contextMenu.y, left: contextMenu.x }}
      className="fixed z-[80] w-56 bg-m3-card border border-m3-border rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] p-1.5 flex flex-col gap-0.5 text-xs select-none hosanna-enter"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {contextMenu.type === "canvas" ? (
        <>
          <div className={MENU_HEADER}>
            <span>
              {currentFolder
                ? currentFolder.name
                : t("explorer.contextMenu.rootDirectory")}
            </span>
            <span className="text-caption font-normal">
              {t("explorer.contextMenu.options")}
            </span>
          </div>

          <Can permission="folder.create">
            <button
              onClick={() => {
                onOpenModal("create-folder");
                onClose();
              }}
              className={MENU_ITEM}
            >
              <FolderPlus className={MENU_ICON} />
              <span>{t("explorer.contextMenu.newFolder")}</span>
            </button>
          </Can>

          <Can permission="song.create">
            <button
              onClick={() => {
                onOpenModal("create-song");
                onClose();
              }}
              className={MENU_ITEM}
            >
              <Plus className={MENU_ICON} />
              <span>{t("explorer.contextMenu.newSong")}</span>
            </button>
          </Can>

          <Can permission="song.import">
            <button
              onClick={() => {
                fileInputRef.current?.click();
                onClose();
              }}
              className={MENU_ITEM}
            >
              <Upload className={MENU_ICON} />
              <span>{t("explorer.contextMenu.uploadFiles")}</span>
            </button>
          </Can>

          <div className="my-1 border-t border-m3-border" />

          <button
            onClick={() => {
              onSelectAll();
              onClose();
            }}
            className={MENU_ITEM}
          >
            <CheckSquare className={MENU_ICON} />
            <span>{t("explorer.contextMenu.selectAll")}</span>
          </button>

          <button
            onClick={() => {
              onRefreshView();
              onClose();
            }}
            className={MENU_ITEM}
          >
            <RotateCw className={MENU_ICON} />
            <span>{t("explorer.contextMenu.refreshView")}</span>
          </button>
        </>
      ) : totalSelectedCount > 1 ? (
        <>
          <div className={`${MENU_HEADER} text-m3-primary`}>
            <span>{t("explorer.contextMenu.multiSelect")}</span>
            <Badge variant="accent">{totalSelectedCount}</Badge>
          </div>

          {selectedSongIds.size > 0 && (
            <>
              <Can permission="song.update">
                <button
                  onClick={() => {
                    onOpenModal("batch-tag");
                    onClose();
                  }}
                  className={MENU_ITEM}
                >
                  <Tag className={MENU_ICON} />
                  <span>
                    {t("explorer.contextMenu.tagSongsCount", {
                      count: selectedSongIds.size,
                    })}
                  </span>
                </button>
                <button
                  data-tour="ctx-add-to-collection"
                  onClick={() => {
                    onOpenModal("batch-add-to-collection");
                    onClose();
                  }}
                  className={MENU_ITEM}
                >
                  <FolderPlus className={MENU_ICON} />
                  <span>
                    {t("explorer.contextMenu.addToCollectionCount", {
                      count: selectedSongIds.size,
                    })}
                  </span>
                </button>
              </Can>
              <Can permission="export.pdf">
                <button
                  onClick={() => {
                    onPrintSongs?.();
                    onClose();
                  }}
                  className={MENU_ITEM}
                >
                  <Printer className={MENU_ICON} />
                  <span>
                    {t("explorer.contextMenu.printSongsCount", {
                      count: selectedSongIds.size,
                    })}
                  </span>
                </button>
              </Can>
            </>
          )}

          {selectedFolderIds.size > 0 && (
            <Can permission="export.pdf">
              <button
                onClick={() => {
                  onPrintFolders?.();
                  onClose();
                }}
                className={MENU_ITEM}
              >
                <Printer className={MENU_ICON} />
                <span>
                  {t("explorer.contextMenu.printFoldersCount", {
                    count: selectedFolderIds.size,
                  })}
                </span>
              </button>
            </Can>
          )}

          <CanAll permissions={["song.update", "folder.update"]}>
            <button
              onClick={() => {
                onOpenModal("batch-move");
                onClose();
              }}
              className={MENU_ITEM}
            >
              <Move className={MENU_ICON} />
              <span>
                {t("explorer.contextMenu.moveItemsCount", {
                  count: totalSelectedCount,
                })}
              </span>
            </button>
          </CanAll>

          <CanAll permissions={["song.delete", "folder.delete"]}>
            <button
              onClick={() => {
                onOpenModal("batch-delete");
                onClose();
              }}
              className={MENU_ITEM_DANGER}
            >
              <Trash2 className="w-4 h-4 text-m3-danger" />
              <span>
                {t("explorer.contextMenu.deleteItemsCount", {
                  count: totalSelectedCount,
                })}
              </span>
            </button>
          </CanAll>

          <div className="my-1 border-t border-m3-border" />

          <button
            onClick={() => {
              onClearSelection();
              onClose();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 min-h-10 rounded-[var(--radius-md)] text-m3-secondary hover:bg-m3-hover font-medium transition-colors text-left cursor-pointer"
          >
            <X className="w-4 h-4 text-m3-secondary" />
            <span>{t("explorer.contextMenu.deselect")}</span>
          </button>
        </>
      ) : (
        <>
          <div className={`${MENU_HEADER} block`}>
            {contextMenu.type === "folder"
              ? (contextMenu.item as Folder).name
              : (contextMenu.item as Song).title}
          </div>

          {contextMenu.type === "folder" ? (
            <>
              <button
                onClick={() => {
                  onSelectFolder((contextMenu.item as Folder).id);
                  onClose();
                }}
                className={MENU_ITEM}
              >
                <FolderOpen className={MENU_ICON} />
                <span>{t("explorer.contextMenu.openFolder")}</span>
              </button>

              <Can permission="folder.update">
                <button
                  onClick={() => {
                    onCustomizeFolder?.(contextMenu.item as Folder);
                    onClose();
                  }}
                  className={MENU_ITEM}
                >
                  <Palette className={MENU_ICON} />
                  <span>{t("explorer.contextMenu.customizeFolder")}</span>
                </button>

                <button
                  onClick={() => {
                    onRenameFolder(contextMenu.item as Folder);
                    onClose();
                  }}
                  className={MENU_ITEM}
                >
                  <Edit2 className={MENU_ICON} />
                  <span>{t("explorer.contextMenu.renameFolder")}</span>
                </button>

                <button
                  onClick={() => {
                    onMoveFolder(contextMenu.item as Folder);
                    onClose();
                  }}
                  className={MENU_ITEM}
                >
                  <Move className={MENU_ICON} />
                  <span>{t("explorer.contextMenu.moveFolder")}</span>
                </button>
              </Can>

              <Can permission="export.pdf">
                <button
                  onClick={() => {
                    onPrintFolder?.((contextMenu.item as Folder).id);
                    onClose();
                  }}
                  className={MENU_ITEM}
                >
                  <Printer className={MENU_ICON} />
                  <span>{t("explorer.contextMenu.printFolder")}</span>
                </button>
              </Can>

              <Can permission="folder.delete">
                <div className="my-1 border-t border-m3-border" />

                <button
                  onClick={() => {
                    onDeleteFolder(contextMenu.item as Folder);
                    onClose();
                  }}
                  className={MENU_ITEM_DANGER}
                >
                  <Trash2 className="w-4 h-4 text-m3-danger" />
                  <span>{t("explorer.contextMenu.deleteFolder")}</span>
                </button>
              </Can>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  navigate(
                    `${slugPrefix}/songs/${(contextMenu.item as Song).id}`,
                  );
                  onClose();
                }}
                className={MENU_ITEM}
              >
                <ExternalLink className={MENU_ICON} />
                <span>{t("explorer.contextMenu.openEditSong")}</span>
              </button>
              <Can permission="song.update">
                <button
                  onClick={() => {
                    onMoveSong(contextMenu.item as Song);
                    onClose();
                  }}
                  className={MENU_ITEM}
                >
                  <ArrowRightLeft className={MENU_ICON} />
                  <span>{t("explorer.contextMenu.moveSong")}</span>
                </button>

                {onAddToCollection && (
                  <button
                    data-tour="ctx-add-to-collection"
                    onClick={() => {
                      onAddToCollection(contextMenu.item as Song);
                      onClose();
                    }}
                    className={MENU_ITEM}
                  >
                    <FolderPlus className={MENU_ICON} />
                    <span>{t("explorer.contextMenu.addToCollection")}</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    onTagSong(contextMenu.item as Song);
                    onClose();
                  }}
                  className={MENU_ITEM}
                >
                  <Tag className={MENU_ICON} />
                  <span>{t("explorer.contextMenu.tagSong")}</span>
                </button>
              </Can>
              <Can permission="export.pdf">
                <button
                  onClick={() => {
                    onPrintSong?.((contextMenu.item as Song).id);
                    onClose();
                  }}
                  className={MENU_ITEM}
                >
                  <Printer className={MENU_ICON} />
                  <span>{t("explorer.contextMenu.printSong")}</span>
                </button>
              </Can>

              <Can permission="song.delete">
                <div className="my-1 border-t border-m3-border" />

                <button
                  onClick={() => {
                    onDeleteSong(contextMenu.item as Song);
                    onClose();
                  }}
                  className={MENU_ITEM_DANGER}
                >
                  <Trash2 className="w-4 h-4 text-m3-danger" />
                  <span>{t("explorer.contextMenu.deleteSong")}</span>
                </button>
              </Can>
            </>
          )}
        </>
      )}
    </div>
  );
};
