/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Modal } from "@/src/components/common";
import { useI18n } from "@/src/lib/i18n";
import { Folder } from "@/src/types";
import {
  Check,
  Loader2,
  Palette,
  RotateCcw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import {
  FOLDER_COLORS,
  FOLDER_ICONS,
  getFolderColorStyle,
  getFolderIconComponent,
} from "../../utils/folderCustomization";

interface CustomizeFolderModalProps {
  folder: Folder | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (color: string, icon: string) => Promise<void>;
}

export const CustomizeFolderModal: React.FC<CustomizeFolderModalProps> = ({
  folder,
  isOpen,
  onClose,
  onSave,
}) => {
  const { t } = useI18n();
  const [selectedColor, setSelectedColor] = useState<string>("default");
  const [selectedIcon, setSelectedIcon] = useState<string>("default");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (folder && isOpen) {
      setSelectedColor(folder.color || "default");
      setSelectedIcon(folder.icon || "default");
      setSearchQuery("");
    }
  }, [folder, isOpen]);

  // Filtragem de ícones inteligente (insensível a maiúsculas e acentos)
  const filteredIcons = useMemo(() => {
    if (!searchQuery.trim()) return FOLDER_ICONS;

    const normalizedQuery = searchQuery
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    return FOLDER_ICONS.filter((item) => {
      const normalizedName = item.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      return normalizedName.includes(normalizedQuery);
    });
  }, [searchQuery]);

  if (!folder) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(selectedColor, selectedIcon);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSelectedColor("default");
    setSelectedIcon("default");
  };

  const PreviewIcon = getFolderIconComponent(selectedIcon);
  const previewColorStyle = getFolderColorStyle(selectedColor);
  const currentIconObj = FOLDER_ICONS.find((i) => i.id === selectedIcon);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("modals.customizeFolder")}
    >
      <div className="flex flex-col gap-5 max-h-[calc(85vh-6rem)]">
        {/* Hero Preview Card */}
        <div className="relative overflow-hidden flex items-center gap-4 p-3.5 sm:p-4 rounded-2xl bg-linear-to-br from-m3-sidebar to-m3-hover/70 dark:from-m3-sidebar dark:to-m3-card border border-m3-border/80 dark:border-m3-border/60 shadow-inner">
          <div
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center border shadow-sm transition-all duration-300 shrink-0 ${previewColorStyle.bgClass} ${previewColorStyle.borderClass} ${previewColorStyle.textClass}`}
          >
            <PreviewIcon className="w-7 h-7 sm:w-8 sm:h-8 transition-transform duration-300 group-hover:scale-110" />
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm sm:text-base font-bold text-m3-text dark:text-m3-text truncate">
                {folder.name}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-m3-card dark:bg-m3-sidebar text-slate-600 dark:text-slate-300 border border-m3-border dark:border-m3-border shadow-2xs">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: previewColorStyle.colorHex }}
                />
                {previewColorStyle.name}
              </span>

              <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full bg-m3-card dark:bg-m3-sidebar text-slate-600 dark:text-slate-300 border border-m3-border dark:border-m3-border shadow-2xs">
                {currentIconObj?.name || t("modals.defaultIcon")}
              </span>
            </div>
          </div>

          {/* Quick Reset to Default Action */}
          {(selectedColor !== "default" || selectedIcon !== "default") && (
            <button
              type="button"
              onClick={handleReset}
              title={t("modals.restoreDefaults")}
              className="p-2 rounded-xl text-m3-secondary hover:text-slate-600 dark:hover:text-slate-200 hover:bg-m3-card/80 dark:hover:bg-slate-800/80 transition-colors shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Color Swatches Selection */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-m3-secondary dark:text-m3-secondary flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-m3-primary" />
              <span>{t("modals.highlightColor")}</span>
            </label>
            <span className="text-xs text-m3-secondary dark:text-m3-secondary font-medium">
              {previewColorStyle.name}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 p-1">
            {FOLDER_COLORS.map((c) => {
              const isSelected = selectedColor === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedColor(c.id)}
                  title={c.name}
                  aria-label={`Cor ${c.name}`}
                  className={`group relative w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-all duration-200 flex items-center justify-center ${
                    isSelected
                      ? "ring-2 ring-offset-2 ring-m3-primary dark:ring-offset-m3-card scale-110 shadow-sm"
                      : "hover:scale-110 opacity-90 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: c.colorHex }}
                >
                  {isSelected && (
                    <Check
                      className={`w-4 h-4 ${
                        c.id === "yellow" || c.id === "white" || c.id === "lime"
                          ? "text-m3-text"
                          : "text-white"
                      } drop-shadow`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Icon Selection with Search Header */}
        <div className="flex flex-col gap-2 min-h-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-semibold text-m3-secondary dark:text-m3-secondary flex items-center gap-1.5 shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-m3-primary" />
              <span>
                {t("modals.iconCount", { count: filteredIcons.length })}
              </span>
            </label>

            {/* Quick Search */}
            <div className="relative w-36 sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-m3-secondary pointer-events-none" />
              <input
                type="text"
                placeholder={t("modals.searchIcons")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1 text-xs rounded-lg bg-m3-hover dark:bg-m3-sidebar border border-m3-border dark:border-m3-border text-m3-text dark:text-m3-text placeholder-m3-input focus:outline-hidden focus:ring-1 focus:ring-m3-primary focus:border-m3-primary transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-m3-secondary hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Icons Grid with dedicated scroll containment */}
          <div className="relative flex-1 min-h-35 max-h-55 sm:max-h-60 overflow-y-auto rounded-xl border border-m3-border/80 dark:border-m3-border bg-m3-sidebar/40 dark:bg-m3-card/40 p-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
            {filteredIcons.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-8 text-center text-m3-secondary">
                <Search className="w-6 h-6 mb-1 opacity-50" />
                <p className="text-xs">
                  {t("modals.noIconFound", { query: searchQuery })}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                {filteredIcons.map((item) => {
                  const IconComp = item.icon;
                  const isSelected = selectedIcon === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedIcon(item.id)}
                      title={item.name}
                      aria-label={item.name}
                      className={`group relative flex flex-col items-center justify-center aspect-square p-2 rounded-xl border transition-all ${
                        isSelected
                          ? "bg-m3-primary/100/10 border-m3-primary text-sky-600 dark:text-sky-400 ring-2 ring-m3-primary/20 font-semibold shadow-2xs"
                          : "bg-m3-card dark:bg-m3-sidebar/60 border-m3-border/70 dark:border-m3-border/50 hover:bg-m3-hover dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:scale-105"
                      }`}
                    >
                      <IconComp className="w-5 h-5 transition-transform group-hover:scale-110" />
                      <span className="text-[10px] text-m3-secondary dark:text-m3-secondary truncate w-full text-center mt-1 leading-none opacity-80 group-hover:opacity-100">
                        {item.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-m3-border mt-auto">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSaving}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            disabled={isSaving}
            className="min-w-30"
          >
            {isSaving ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("modals.saving")}
              </span>
            ) : (
              t("common.save")
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
