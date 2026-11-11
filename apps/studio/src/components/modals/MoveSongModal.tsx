/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Modal } from "@hosanna/ui";
import { useI18n } from "@/src/lib/i18n";
import { Folder } from "@/src/types";
import { HardDrive } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { buildFolderTree, MoveFolderTreeItem } from "../explorer";

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
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(initialFolderId || null);
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(new Set());

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
        songTitle ? t("modals.moveSongTitle", { title: songTitle }) : t("modals.moveSongToFolder")
      }
    >
      <div className="flex flex-col gap-4">
        {songTitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t("modals.chooseDestination")}{" "}
            <strong className="text-slate-900 dark:text-slate-100">{songTitle}</strong>:
          </p>
        )}

        <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
          <label className="flex items-center gap-3 p-3 border border-m3-border rounded-md cursor-pointer hover:bg-m3-hover">
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
          <Button variant="primary" isLoading={isLoading} onClick={handleConfirm}>
            {t("modals.moveSong")}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
