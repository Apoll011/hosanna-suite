/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Spinner, Surface } from "@hosanna/ui";
import { useI18n } from "@/src/lib/i18n";
import { useCan } from "@/src/lib/permissions/client";
import { Clock, Loader2, Lock, RotateCcw, Save, Shield } from "lucide-react";
import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useOrgSettings } from "../../hooks/useOrgSettings";

export interface ServiceBehaviorTabProps {
  active: boolean;
  showToast?: (text: string, variant: "success" | "error" | "info" | "warning") => void;
}

const inputClass =
  "w-full rounded-md border border-m3-border bg-m3-card text-m3-text text-sm px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-m3-primary/25 focus:border-m3-primary disabled:opacity-60 disabled:bg-m3-sidebar transition-colors";

export const ServiceBehaviorTab: React.FC<ServiceBehaviorTabProps> = ({ active, showToast }) => {
  const { organization } = useAuth();
  const { t } = useI18n();
  const { granted: canManageOrg, loading: canLoading } = useCan("organization.update");
  const { settings, isSaving, update, reset, save } = useOrgSettings();

  if (!active) return null;

  if (canLoading || !organization) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-m3-secondary">
        <Spinner size="lg" label={t("settings.general.loading")} />
      </div>
    );
  }

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

  const toggles = [
    {
      id: "showServiceDuration" as const,
      label: t("settings.general.showDuration"),
      description: t("settings.general.showDurationDesc"),
      checked: settings.services.showServiceDuration,
    },
    {
      id: "showNotes" as const,
      label: t("settings.general.showNotes"),
      description: t("settings.general.showNotesDesc"),
      checked: settings.services.showNotes,
    },
    {
      id: "autoSave" as const,
      label: t("settings.general.autoSave"),
      description: t("settings.general.autoSaveDesc"),
      checked: settings.services.autoSave,
    },
  ] as const;

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      {!canManageOrg && (
        <div className="flex justify-end">
          <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-md flex items-center gap-1.5 font-semibold">
            <Lock className="w-3.5 h-3.5" />
            {t("settings.general.readOnly")}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Surface className="h-full">
          <div className="mb-6">
            <h2 className="text-title text-m3-text flex items-center gap-2">
              <Clock className="w-5 h-5 text-m3-primary" />
              {t("settings.general.usualStartTime")}
            </h2>
            <p className="mt-1 text-muted">{t("settings.general.usualStartTimeDesc")}</p>
          </div>
          <input
            type="time"
            value={settings.services.usualStartTime}
            disabled={!canManageOrg || isSaving}
            onChange={(e) => update("services", "usualStartTime", e.target.value || "10:00")}
            className={`${inputClass} max-w-48`}
          />
        </Surface>

        <Surface className="h-full">
          <div className="mb-6">
            <h2 className="text-title text-m3-text flex items-center gap-2">
              <Shield className="w-5 h-5 text-m3-primary" />
              {t("settings.general.behaviorTitle")}
            </h2>
            <p className="mt-1 text-muted">{t("settings.services.pageDesc")}</p>
          </div>
          <div className="space-y-3">
            {toggles.map((toggle) => (
              <label
                key={toggle.id}
                className={`flex items-start gap-4 p-4 border border-m3-border rounded-md transition-colors ${
                  canManageOrg && !isSaving
                    ? "cursor-pointer hover:bg-m3-sidebar/80"
                    : "opacity-75 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center h-5 mt-0.5">
                  <input
                    type="checkbox"
                    disabled={!canManageOrg || isSaving}
                    checked={toggle.checked}
                    onChange={(e) => update("services", toggle.id, e.target.checked)}
                    className="w-4.5 h-4.5 text-m3-primary border-m3-border rounded focus:ring-m3-primary cursor-pointer"
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-m3-text">{toggle.label}</span>
                  <p className="text-caption mt-0.5">{toggle.description}</p>
                </div>
              </label>
            ))}
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
              isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )
            }
          >
            {isSaving ? t("settings.general.saving") : t("settings.general.save")}
          </Button>
        </div>
      )}
    </form>
  );
};
