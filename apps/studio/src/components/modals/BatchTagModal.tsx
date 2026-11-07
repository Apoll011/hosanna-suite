/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Badge, Button, Input, Modal } from "@/src/components/common";
import { useI18n } from "@/src/lib/i18n";
import { Check, Plus, Tag as TagIcon, X } from "lucide-react";
import React, { useEffect, useState } from "react";

interface BatchTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSongIds: string[];
  onConfirm: (
    tags: string[],
    mode: "append" | "replace" | "remove",
  ) => Promise<void>;
}

const PRESET_CATEGORIES = [
  "Louvor",
  "Adoração",
  "Comunhão",
  "Ceia",
  "Natal",
  "Páscoa",
  "Crianças",
  "Oração",
  "Agradecimento",
  "Entrada",
  "Ofertório",
  "Envio",
  "Festivo",
  "Acústico",
  "Jovens",
];

export const BatchTagModal: React.FC<BatchTagModalProps> = ({
  isOpen,
  onClose,
  selectedSongIds,
  onConfirm,
}) => {
  const { t } = useI18n();
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [mode, setMode] = useState<"append" | "replace" | "remove">("append");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTags([]);
      setCustomTag("");
      setMode("append");
    }
  }, [isOpen]);

  const togglePresetTag = (preset: string) => {
    if (tags.includes(preset)) {
      setTags(tags.filter((t) => t !== preset));
    } else {
      setTags([...tags, preset]);
    }
  };

  const handleAddCustomTag = () => {
    const trimmed = customTag.trim();
    if (!trimmed) return;
    if (!tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setCustomTag("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCustomTag();
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleConfirm = async () => {
    if (tags.length === 0 && mode !== "replace") return;
    setIsLoading(true);
    try {
      await onConfirm(tags, mode);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const count = selectedSongIds.length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("modals.batchTagTitle", { count })}
    >
      <div className="flex flex-col gap-5 text-m3-text">
        <p className="text-xs text-m3-secondary">
          {t("modals.selectCategories")}{" "}
          <strong className="text-m3-text">
            {t("modals.selectedSongs", { count })}
          </strong>
          .
        </p>

        {/* Mode Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-label text-m3-textr text-[10px]">
            {t("modals.applyMode")}
          </label>
          <div className="grid grid-cols-3 gap-2 p-1 bg-m3-sidebar/60 rounded-xl">
            <button
              type="button"
              onClick={() => setMode("append")}
              className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-colors text-center cursor-pointer ${
                mode === "append"
                  ? "bg-m3-card text-m3-primary shadow-[var(--shadow-sm)]"
                  : "text-m3-secondary hover:text-m3-text"
              }`}
            >
              {t("modals.add")}
            </button>
            <button
              type="button"
              onClick={() => setMode("replace")}
              className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-colors text-center cursor-pointer ${
                mode === "replace"
                  ? "bg-m3-card text-amber-600 dark:text-amber-400 shadow-[var(--shadow-sm)]"
                  : "text-m3-secondary hover:text-m3-text"
              }`}
            >
              {t("modals.replace")}
            </button>
            <button
              type="button"
              onClick={() => setMode("remove")}
              className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-colors text-center cursor-pointer ${
                mode === "remove"
                  ? "bg-m3-card text-m3-danger shadow-[var(--shadow-sm)]"
                  : "text-m3-secondary hover:text-m3-text"
              }`}
            >
              {t("modals.remove")}
            </button>
          </div>
          <span className="text-[11px] text-m3-secondary italic">
            {mode === "append" && t("modals.appendDesc")}
            {mode === "replace" && t("modals.replaceDesc")}
            {mode === "remove" && t("modals.removeDesc")}
          </span>
        </div>

        {/* Preset Categories */}
        <div className="flex flex-col gap-2">
          <label className="text-label flex items-center gap-1.5">
            {t("modals.suggestedCategories")}
          </label>
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1.5 border border-m3-border rounded-xl bg-m3-sidebar/50 dark:bg-m3-card/30">
            {PRESET_CATEGORIES.map((cat) => {
              const isSelected = tags.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => togglePresetTag(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer select-none ${
                    isSelected
                      ? "bg-m3-primary text-white shadow-[var(--shadow-sm)]"
                      : "bg-m3-card text-m3-text border border-m3-border hover:border-m3-primary"
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-3" />}
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Tag Input */}
        <div className="flex flex-col gap-2">
          <label className="text-label">{t("modals.newCustomTag")}</label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder={t("modals.customTagPlaceholder")}
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={handleKeyDown}
                icon={<TagIcon className="w-4 h-4 text-m3-secondary" />}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              icon={<Plus className="w-4 h-4 text-m3-primary" />}
              onClick={handleAddCustomTag}
              disabled={!customTag.trim()}
            >
              {t("modals.add")}
            </Button>
          </div>
        </div>

        {/* Selected Tags Preview */}
        {tags.length > 0 && (
          <div className="flex flex-col gap-1.5 p-3 bg-m3-primary/10 border border-m3-primary/20 rounded-xl">
            <span className="text-label text-m3-primary">
              {t("modals.tagsToApply", {
                action:
                  mode === "remove"
                    ? t("modals.removeLower")
                    : t("modals.applyLower"),
                count: tags.length,
              })}
            </span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant={mode === "remove" ? "rose" : "sky"}
                  className="flex items-center gap-1 text-xs py-1 px-2.5"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-m3-danger rounded p-0.5 cursor-pointer ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 mt-2 pt-4 border-t border-m3-border/60">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="primary"
            isLoading={isLoading}
            onClick={handleConfirm}
            disabled={tags.length === 0 && mode !== "replace"}
            icon={<TagIcon className="w-4 h-4" />}
          >
            {t("modals.applyToCount", { count })}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
