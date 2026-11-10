/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Input, Spinner, Surface } from "@hosanna/ui";
import { useAuth } from "@/src/contexts/AuthContext";
import { useOrgSettings } from "@/src/hooks/useOrgSettings";
import { useI18n } from "@/src/lib/i18n";
import { useCan } from "@/src/lib/permissions/client";
import { ResponsibilityColor, ResponsibilityIconKey } from "@/src/types";
import { COLOR_MAP, ICON_MAP } from "@/src/utils/iconMap";
import { Loader2, Lock, Plus, RotateCcw, Save, Trash2, Users } from "lucide-react";
import React, { useState } from "react";

export interface ResponsibilitiesTabProps {
  active: boolean;
  showToast?: (text: string, variant: "success" | "error" | "info" | "warning") => void;
}

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

export const ResponsibilitiesTab: React.FC<ResponsibilitiesTabProps> = ({ active, showToast }) => {
  const { organization } = useAuth();
  const { t, tc } = useI18n();
  const { granted: canManageOrg, loading: canLoading } = useCan("organization.update");
  const {
    settings,
    isSaving,
    reset,
    save,
    addResponsibilityCategory,
    removeResponsibilityCategory,
  } = useOrgSettings();

  const [label, setLabel] = useState("");
  const [icon, setIcon] = useState<ResponsibilityIconKey>("mic");
  const [color, setColor] = useState<ResponsibilityColor>("sky");

  if (!active) return null;

  if (canLoading || !organization) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-m3-secondary">
        <Spinner size="lg" label={t("settings.general.loading")} />
      </div>
    );
  }

  const categories = settings.agenda.responsibilityCategories;
  const disabled = !canManageOrg || isSaving;

  const handleAdd = () => {
    if (!label.trim() || disabled) return;
    addResponsibilityCategory({ label: label.trim(), icon, color });
    setLabel("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageOrg) return;
    try {
      await save();
      showToast?.(t("settings.toast.orgSaved"), "success");
    } catch (err) {
      showToast?.(
        t("settings.toast.orgSaveError", {
          error: (err as { message?: string })?.message || t("settings.general.commError"),
        }),
        "error",
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Surface className="h-full">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-title text-m3-text flex items-center gap-2">
                <Users className="w-5 h-5 text-m3-primary" />
                {t("settings.general.responsibilities.title")}
              </h2>
              <p className="mt-1 text-muted">{t("settings.responsibilities.pageDesc")}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {categories.length > 0 && (
                <span className="text-caption bg-m3-sidebar text-m3-secondary px-3 py-1.5 rounded-md">
                  {tc("settings.general.responsibilities.count", categories.length)}
                </span>
              )}
              {!canManageOrg && (
                <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-md flex items-center gap-1.5 font-semibold">
                  <Lock className="w-3.5 h-3.5" />
                  {t("settings.general.readOnly")}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {categories.map((c) => {
              const Icon = ICON_MAP[c.icon];
              const colors = COLOR_MAP[c.color];
              return (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-md border border-m3-border"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colors.bg} ${colors.text}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-m3-text truncate">{c.label}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeResponsibilityCategory(c.id)}
                    disabled={disabled}
                    className="p-2 text-m3-secondary hover:text-rose-500 rounded-md transition-colors cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                    title={t("settings.general.responsibilities.remove")}
                    aria-label={t("settings.general.responsibilities.remove")}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
            {categories.length === 0 && (
              <p className="text-sm text-m3-secondary py-6 text-center">
                {t("settings.general.responsibilities.empty")}
              </p>
            )}
          </div>
        </Surface>

        <Surface className="h-full">
          <div className="mb-6">
            <h2 className="text-title text-m3-text flex items-center gap-2">
              <Plus className="w-5 h-5 text-m3-primary" />
              {t("settings.general.responsibilities.newLabel")}
            </h2>
            <p className="mt-1 text-muted">{t("settings.general.responsibilities.hint")}</p>
          </div>

          <div className="space-y-4">
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
              <div>
                <label className="block text-label mb-1.5">
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
                        className={`inline-flex items-center justify-center min-h-10 min-w-10 rounded-md border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
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

              <div>
                <label className="block text-label mb-1.5">
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
                        className={`min-h-10 min-w-10 rounded-md border-2 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${colors.bg} ${
                          isSelected ? "border-m3-text" : "border-transparent"
                        }`}
                        aria-label={opt}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                type="button"
                disabled={!label.trim() || disabled}
                onClick={handleAdd}
                icon={<Plus className="w-4 h-4" />}
              >
                {t("settings.general.responsibilities.add")}
              </Button>
            </div>
          </div>
        </Surface>
      </div>

      {canManageOrg && (
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={reset}
            disabled={isSaving}
            className="text-xs text-m3-secondary hover:text-m3-text flex items-center gap-1 font-medium transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {t("settings.general.reset")}
          </button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSaving}
            icon={
              isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />
            }
          >
            {isSaving ? t("settings.general.saving") : t("settings.general.save")}
          </Button>
        </div>
      )}
    </form>
  );
};
