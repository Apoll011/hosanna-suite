/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Spinner } from "@hosanna/ui";
import {
  DurationField,
  durationInputToSeconds,
  secondsToDurationInput,
} from "@/src/components/DurationField";
import { useAuth } from "@/src/contexts/AuthContext";
import { useOrgSettings } from "@/src/hooks/useOrgSettings";
import { useI18n } from "@/src/lib/i18n";
import { useCan } from "@/src/lib/permissions/client";
import { Loader2, Lock, Mic2, Music, RotateCcw, Save, Timer } from "lucide-react";
import React from "react";

export interface DurationsTabProps {
  active: boolean;
  showToast?: (text: string, variant: "success" | "error" | "info" | "warning") => void;
}

const SONG_PRESETS = [
  { label: "3:30", sec: 210 },
  { label: "4:00", sec: 240 },
  { label: "5:00", sec: 300 },
  { label: "6:30", sec: 390 },
];

const SERMON_PRESETS = [
  { label: "30:00", sec: 1800 },
  { label: "40:00", sec: 2400 },
  { label: "45:00", sec: 2700 },
  { label: "60:00", sec: 3600 },
];

export const DurationsTab: React.FC<DurationsTabProps> = ({ active, showToast }) => {
  const { organization } = useAuth();
  const { t } = useI18n();
  const { granted: canManageOrg, loading: canLoading } = useCan("organization.update");
  const { settings, isSaving, update, reset, save } = useOrgSettings();

  const [songRaw, setSongRaw] = React.useState(
    secondsToDurationInput(settings.services.songDuration),
  );
  const [sermonRaw, setSermonRaw] = React.useState(
    secondsToDurationInput(settings.services.sermonDuration),
  );

  React.useEffect(() => {
    setSongRaw(secondsToDurationInput(settings.services.songDuration));
  }, [settings.services.songDuration]);
  React.useEffect(() => {
    setSermonRaw(secondsToDurationInput(settings.services.sermonDuration));
  }, [settings.services.sermonDuration]);

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

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-title text-m3-text flex items-center gap-2">
            <Timer className="w-5 h-5 text-m3-primary" />
            {t("settings.tabs.durations")}
          </h2>
          <p className="text-muted mt-1">{t("settings.durations.pageDesc")}</p>
        </div>
        {!canManageOrg && (
          <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-md flex items-center gap-1.5 font-semibold shrink-0">
            <Lock className="w-3.5 h-3.5" />
            {t("settings.general.readOnly")}
          </span>
        )}
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <DurationField
          label={t("settings.general.songLabel")}
          icon={<Music className="w-4 h-4 text-indigo-500" />}
          value={songRaw}
          onChange={(v) => {
            setSongRaw(v);
            update("services", "songDuration", durationInputToSeconds(v));
          }}
          accentRingClass="focus:ring-indigo-400/60"
          badgeClass="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200/50 dark:border-indigo-800/50"
          presets={SONG_PRESETS}
          disabled={!canManageOrg || isSaving}
          placeholder="05:00"
        />
        <DurationField
          label={t("settings.general.sermonLabel")}
          icon={<Mic2 className="w-4 h-4 text-rose-500" />}
          value={sermonRaw}
          onChange={(v) => {
            setSermonRaw(v);
            update("services", "sermonDuration", durationInputToSeconds(v));
          }}
          accentRingClass="focus:ring-rose-400/60"
          badgeClass="text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border-rose-200/50 dark:border-rose-800/50"
          presets={SERMON_PRESETS}
          disabled={!canManageOrg || isSaving}
          placeholder="40:00"
        />
      </div>

      {canManageOrg && (
        <div className="flex justify-between items-center pt-2">
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
