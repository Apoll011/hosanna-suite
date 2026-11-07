import { Button } from "@/src/components/common";
import { useI18n } from "@/src/lib/i18n";
import { Archive, FolderInput, Printer, Tag, Trash2, X } from "lucide-react";
import React from "react";

interface BatchActionFloatingBarProps {
  selectedCount: number;
  itemLabel?: string;
  onArchive?: () => void;
  onPrint?: () => void;
  onTag?: () => void;
  onMove?: () => void;
  onDelete: () => void;
  onCancel: () => void;
  /** Override the delete button label (e.g. “Remove”). */
  deleteLabel?: string;
}

export const BatchActionFloatingBar: React.FC<BatchActionFloatingBarProps> = ({
  selectedCount,
  itemLabel = "cultos",
  onArchive,
  onPrint,
  onTag,
  onMove,
  onDelete,
  onCancel,
  deleteLabel,
}) => {
  const { t } = useI18n();
  if (selectedCount <= 1) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-m3-card text-m3-text border border-m3-border rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] px-5 py-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <span className="text-label px-2">
        {selectedCount} {itemLabel} selecionados
      </span>
      <div className="h-6 w-px bg-m3-border" />
      {onTag && (
        <Button
          size="sm"
          variant="ghost"
          icon={<Tag className="w-4 h-4" />}
          onClick={onTag}
          className="text-m3-text hover:bg-m3-hover"
        >
          {t("songsPage.tag")}
        </Button>
      )}
      {onMove && (
        <Button
          size="sm"
          variant="ghost"
          icon={<FolderInput className="w-4 h-4" />}
          onClick={onMove}
          className="text-m3-text hover:bg-m3-hover"
        >
          {t("songsPage.move")}
        </Button>
      )}
      {onPrint && (
        <Button
          size="sm"
          variant="ghost"
          icon={<Printer className="w-4 h-4" />}
          onClick={onPrint}
          className="text-m3-text hover:bg-m3-hover"
        >
          {t("common.print")}
        </Button>
      )}
      {onArchive && (
        <Button
          size="sm"
          variant="ghost"
          icon={<Archive className="w-4 h-4" />}
          onClick={onArchive}
          className="text-m3-text hover:bg-m3-hover"
        >
          {t("common.archive")}
        </Button>
      )}
      <Button
        size="sm"
        variant="ghost"
        icon={<Trash2 className="w-4 h-4" />}
        onClick={onDelete}
        className="text-m3-danger hover:bg-m3-danger/10"
      >
        {deleteLabel ?? t("common.delete")}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        icon={<X className="w-4 h-4" />}
        onClick={onCancel}
        className="text-m3-text hover:bg-m3-hover"
      >
        {t("common.cancel")}
      </Button>
    </div>
  );
};
