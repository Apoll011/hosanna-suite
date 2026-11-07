/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Modal } from "@/src/components/common";
import { useI18n } from "@/src/lib/i18n";
import { Folder } from "@/src/types";
import {
  ChevronDown,
  ChevronRight,
  Folder as FolderIcon,
  HardDrive,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

interface FolderTreeNode {
  folder: Folder;
  level: number;
  children: FolderTreeNode[];
}

function buildFolderTree(folders: Folder[]): FolderTreeNode[] {
  const childrenMap = new Map<string | null, Folder[]>();

  folders.forEach((f) => {
    const parentId = f.parentId || null;
    if (!childrenMap.has(parentId)) {
      childrenMap.set(parentId, []);
    }
    childrenMap.get(parentId)!.push(f);
  });

  function getNodes(parentId: string | null, level: number): FolderTreeNode[] {
    const list = childrenMap.get(parentId) || [];
    return list.map((folder) => ({
      folder,
      level,
      children: getNodes(folder.id, level + 1),
    }));
  }

  return getNodes(null, 0);
}

const MoveFolderTreeItem: React.FC<{
  node: FolderTreeNode;
  selectedFolderId: string | null;
  onSelect: (id: string) => void;
  expandedFolderIds: Set<string>;
  toggleExpand: (id: string) => void;
}> = ({
  node,
  selectedFolderId,
  onSelect,
  expandedFolderIds,
  toggleExpand,
}) => {
  const isSelected = selectedFolderId === node.folder.id;
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedFolderIds.has(node.folder.id);

  return (
    <div className="flex flex-col w-full">
      <label
        style={{ paddingLeft: `${12 + node.level * 16}px` }}
        className={`flex items-center gap-2.5 p-2.5 border rounded-[var(--radius-md)] transition-colors cursor-pointer ${
          isSelected
            ? "bg-m3-primary/10 border-m3-primary/40"
            : "border-m3-border hover:bg-m3-hover"
        }`}
      >
        <input
          type="radio"
          name="moveSongTreeRadio"
          checked={isSelected}
          onChange={() => onSelect(node.folder.id)}
          className="text-m3-primary focus:ring-m3-primary"
        />

        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleExpand(node.folder.id);
            }}
            className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 transition-colors shrink-0"
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        ) : (
          <span className="w-3.5 h-3.5 shrink-0" />
        )}

        <FolderIcon className="w-4 h-4 text-amber-500 shrink-0" />
        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
          {node.folder.name}
        </span>
      </label>

      {hasChildren && isExpanded && (
        <div className="flex flex-col gap-1.5 mt-1.5">
          {node.children.map((child) => (
            <MoveFolderTreeItem
              key={child.folder.id}
              node={child}
              selectedFolderId={selectedFolderId}
              onSelect={onSelect}
              expandedFolderIds={expandedFolderIds}
              toggleExpand={toggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface MoveSongModalProps {
  isOpen: boolean;
  onClose: () => void;
  songTitle?: string;
  initialFolderId?: string | null;
  folders: Folder[];
  onConfirm: (targetFolderId: string | null) => Promise<void> | void;
  isLoading?: boolean;
}

export const MoveSongModal: React.FC<MoveSongModalProps> = ({
  isOpen,
  onClose,
  songTitle,
  initialFolderId = null,
  folders,
  onConfirm,
  isLoading = false,
}) => {
  const { t } = useI18n();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
    initialFolderId || null,
  );
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    if (isOpen) {
      setSelectedFolderId(initialFolderId || null);
      const nextExpanded = new Set<string>();
      folders.forEach((f) => nextExpanded.add(f.id));
      setExpandedFolderIds(nextExpanded);
    }
  }, [isOpen, initialFolderId, folders]);

  const folderTree = useMemo(() => buildFolderTree(folders), [folders]);

  const toggleExpand = (id: string) => {
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = async () => {
    await onConfirm(selectedFolderId);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        songTitle
          ? t("modals.moveSongTitle", { title: songTitle })
          : t("modals.moveSongToFolder")
      }
    >
      <div className="flex flex-col gap-4">
        {songTitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t("modals.chooseDestination")}{" "}
            <strong className="text-slate-900 dark:text-slate-100">
              {songTitle}
            </strong>
            :
          </p>
        )}

        <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
          <label className="flex items-center gap-3 p-3 border border-m3-border rounded-[var(--radius-md)] cursor-pointer hover:bg-m3-hover">
            <input
              type="radio"
              name="moveSongTreeRadio"
              value="root"
              checked={selectedFolderId === null}
              onChange={() => setSelectedFolderId(null)}
              className="text-m3-primary focus:ring-m3-primary"
            />
            <div className="flex items-center gap-2 text-xs font-bold text-m3-text">
              <HardDrive className="w-4 h-4 text-m3-primary" />
              <span>{t("modals.rootLevel")}</span>
            </div>
          </label>

          <div className="flex flex-col gap-1.5 mt-1">
            {folderTree.map((node) => (
              <MoveFolderTreeItem
                key={node.folder.id}
                node={node}
                selectedFolderId={selectedFolderId}
                onSelect={setSelectedFolderId}
                expandedFolderIds={expandedFolderIds}
                toggleExpand={toggleExpand}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="primary"
            isLoading={isLoading}
            onClick={handleConfirm}
          >
            {t("modals.moveSong")}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
