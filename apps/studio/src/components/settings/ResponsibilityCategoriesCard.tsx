/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useI18n } from "@/src/lib/i18n";
import {
  ResponsibilityCategory,
  ResponsibilityColor,
  ResponsibilityIconKey,
} from "@/src/types";
import { Plus, Trash2, Users } from "lucide-react";
import React, { useState } from "react";
import { COLOR_MAP, ICON_MAP } from "../../utils/iconMap";
import { Button, Input } from "../common";

const ICON_OPTIONS: ResponsibilityIconKey[] = [
  "mic",
  "music",
  "volume",
  "light",
  "monitor",
  "book",
  "heart",
  "users",
  "camera",
];

const COLOR_OPTIONS: ResponsibilityColor[] = [
  "amber",
  "violet",
  "sky",
  "rose",
  "emerald",
  "cyan",
  "indigo",
  "slate",
];

export interface ResponsibilityCategoriesCardProps {
  /** Disable creation/removal (e.g. read-only org or while saving). */
  disabled?: boolean;
  /** Current (staged) list of responsibility categories. */
  categories: ResponsibilityCategory[];
  /** Stage a new category (persisted when the tab's "Guardar" is pressed). */
  onAdd: (category: Omit<ResponsibilityCategory, "id">) => void;
  /** Stage removal of a category (persisted when the tab's "Guardar" is pressed). */
  onRemove: (id: string) => void;
}

/**
 * Master list of responsibility categories ("Responsabilidades") that can be
 * assigned to services in the Agenda. Rendered as a standalone settings card
 * inside the General tab's form — like every other setting on this tab it's
 * staged locally and persisted to the org metadata on save, and the Agenda
 * page reads the same list from `useOrgSettings`.
 */
export const ResponsibilityCategoriesCard: React.FC<
  ResponsibilityCategoriesCardProps
> = ({ disabled = false, categories, onAdd, onRemove }) => {
  const { t, tc } = useI18n();

  const [label, setLabel] = useState("");
  const [icon, setIcon] = useState<ResponsibilityIconKey>("mic");
  const [color, setColor] = useState<ResponsibilityColor>("sky");

  const handleAdd = () => {
    if (!label.trim() || disabled) return;
    onAdd({ label: label.trim(), icon, color });
    setLabel("");
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-500" />
              {t("settings.general.responsibilities.title")}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t("settings.general.responsibilities.desc")}
            </p>
          </div>
          {categories.length > 0 && (
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full shrink-0">
              {tc("settings.general.responsibilities.count", categories.length)}
            </span>
          )}
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Existing categories */}
        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          {categories.map((c) => {
            const Icon = ICON_MAP[c.icon];
            const colors = COLOR_MAP[c.color];
            return (
              <div
                key={c.id}
                className="flex items-center justify-between gap-2 p-2 rounded-xl border border-slate-200 dark:border-slate-800"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colors.bg} ${colors.text}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {c.label}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(c.id)}
                  disabled={disabled}
                  className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                  title={t("settings.general.responsibilities.remove")}
                  aria-label={t("settings.general.responsibilities.remove")}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
          {categories.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-4">
              {t("settings.general.responsibilities.empty")}
            </p>
          )}
        </div>

        {/* Create new category */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-3">
          <p className="text-label text-m3-text">
            {t("settings.general.responsibilities.newLabel")}
          </p>

          <Input
            label={t("settings.general.responsibilities.nameLabel")}
            placeholder={t("settings.general.responsibilities.namePlaceholder")}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            disabled={disabled}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
            }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Icon picker */}
            <div>
              <label className="block text-label mb-1">
                {t("settings.general.responsibilities.iconLabel")}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {ICON_OPTIONS.map((opt) => {
                  const Icon = ICON_MAP[opt];
                  const isSelected = icon === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setIcon(opt)}
                      disabled={disabled}
                      className={`inline-flex items-center justify-center min-h-10 min-w-10 rounded-[var(--radius-md)] border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                        isSelected
                          ? "border-m3-primary bg-m3-primary/10 text-m3-primary"
                          : "border-m3-border text-m3-secondary hover:bg-m3-hover"
                      }`}
                      aria-label={opt}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color picker */}
            <div>
              <label className="block text-label mb-1">
                {t("settings.general.responsibilities.colorLabel")}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_OPTIONS.map((opt) => {
                  const colors = COLOR_MAP[opt];
                  const isSelected = color === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setColor(opt)}
                      disabled={disabled}
                      className={`min-h-10 min-w-10 rounded-[var(--radius-md)] border-2 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${colors.bg} ${
                        isSelected ? "border-m3-text" : "border-transparent"
                      }`}
                      aria-label={opt}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              variant="primary"
              type="button"
              disabled={!label.trim() || disabled}
              onClick={handleAdd}
              icon={<Plus className="w-4 h-4" />}
            >
              {t("settings.general.responsibilities.add")}
            </Button>
          </div>
        </div>

        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
          {t("settings.general.responsibilities.hint")}
        </p>
      </div>
    </div>
  );
};
