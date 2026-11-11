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
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(new Set());
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
            {selectedFoldersCount > 0 && t("modals.folderCount", { count: selectedFoldersCount })}
            {selectedFoldersCount > 0 && selectedSongsCount > 0 && t("modals.and")}
            {selectedSongsCount > 0 && t("modals.songCount", { count: selectedSongsCount })}
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
                disabledLabel={t("modals.invalid")}
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
          <Button variant="primary" isLoading={isLoading} onClick={handleConfirm}>
            {t("modals.moveItems", { count: totalItems })}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
