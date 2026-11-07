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
  disabledFolderIds: Set<string>;
  expandedFolderIds: Set<string>;
  toggleExpand: (id: string) => void;
}> = ({
  node,
  selectedFolderId,
  onSelect,
  disabledFolderIds,
  expandedFolderIds,
  toggleExpand,
}) => {
  const { t } = useI18n();
  const isSelected = selectedFolderId === node.folder.id;
  const isDisabled = disabledFolderIds.has(node.folder.id);
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedFolderIds.has(node.folder.id);

  return (
    <div className="flex flex-col w-full">
      <label
        style={{ paddingLeft: `${12 + node.level * 16}px` }}
        className={`flex items-center gap-2.5 p-2.5 border rounded-xl transition-colors ${
          isDisabled
            ? "opacity-40 bg-m3-sidebar/40 cursor-not-allowed border-dashed border-m3-border"
            : isSelected
              ? "bg-m3-primary/10 border-m3-primary/40 cursor-pointer"
              : "border-m3-border hover:bg-m3-hover cursor-pointer"
        }`}
      >
        <input
          type="radio"
          name="batchMoveFolderRadio"
          disabled={isDisabled}
          checked={isSelected}
          onChange={() => !isDisabled && onSelect(node.folder.id)}
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
            className="p-0.5 hover:bg-m3-hover rounded text-m3-secondary transition-colors shrink-0"
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
        <span className="text-xs font-bold text-m3-text truncate">
          {node.folder.name}
          {isDisabled && (
            <span className="text-[10px] font-normal text-m3-secondary ml-1.5">
              {t("modals.invalid")}
            </span>
          )}
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
              disabledFolderIds={disabledFolderIds}
              expandedFolderIds={expandedFolderIds}
              toggleExpand={toggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface BatchMoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFoldersCount: number;
  selectedSongsCount: number;
  disabledFolderIds: Set<string>;
  folders: Folder[];
  onConfirm: (targetFolderId: string | null) => Promise<void>;
}

export const BatchMoveModal: React.FC<BatchMoveModalProps> = ({
  isOpen,
  onClose,
  selectedFoldersCount,
  selectedSongsCount,
  disabledFolderIds,
  folders,
  onConfirm,
}) => {
  const { t } = useI18n();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(
    new Set(),
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedFolderId(null);
      const nextExpanded = new Set<string>();
      folders.forEach((f) => nextExpanded.add(f.id));
      setExpandedFolderIds(nextExpanded);
    }
  }, [isOpen, folders]);

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
    setIsLoading(true);
    try {
      await onConfirm(selectedFolderId);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const totalItems = selectedFoldersCount + selectedSongsCount;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("modals.batchMoveTitle", { count: totalItems })}
    >
      <div className="flex flex-col gap-4">
        <p className="text-xs text-m3-secondary">
          {t("modals.chooseDestFolder")}{" "}
          <strong className="text-m3-text">
            {selectedFoldersCount > 0 &&
              t("modals.folderCount", { count: selectedFoldersCount })}
            {selectedFoldersCount > 0 &&
              selectedSongsCount > 0 &&
              t("modals.and")}
            {selectedSongsCount > 0 &&
              t("modals.songCount", { count: selectedSongsCount })}
          </strong>
          :
        </p>

        <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
          <label className="flex items-center gap-3 p-3 border border-m3-border rounded-xl cursor-pointer hover:bg-m3-hover">
            <input
              type="radio"
              name="batchMoveFolderRadio"
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
                disabledFolderIds={disabledFolderIds}
                expandedFolderIds={expandedFolderIds}
                toggleExpand={toggleExpand}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-m3-border/60">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="primary"
            isLoading={isLoading}
            onClick={handleConfirm}
          >
            {t("modals.moveItems", { count: totalItems })}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
