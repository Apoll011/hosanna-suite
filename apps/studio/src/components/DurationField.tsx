import { TranslateFn, useI18n } from "@/src/lib/i18n";
import React from "react";

// ─── Pure helpers (exported for reuse) ───────────────────────────────────────

export function secondsToDurationInput(seconds?: number): string {
  const safe = Number.isFinite(seconds)
    ? Math.max(0, Math.floor(seconds || 0))
    : 0;
  const mm = Math.floor(safe / 60);
  const ss = safe % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

export function durationInputToSeconds(value: string): number {
  const normalized = value.trim();
  if (!normalized) return 0;

  if (!normalized.includes(":")) {
    // bare number → treat as minutes
    const raw = parseInt(normalized.replace(/\D/g, ""), 10);
    return Number.isFinite(raw) && raw > 0 ? raw * 60 : 0;
  }

  const [minutesRaw, secondsRaw = "0"] = normalized.split(":");
  const minutes = Number(minutesRaw.replace(/\D/g, "") || "0");
  const seconds = Number(secondsRaw.replace(/\D/g, "") || "0");

  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return 0;
  return Math.max(0, minutes * 60 + seconds);
}

export function formatHumanDuration(seconds: number, t: TranslateFn): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return t("settings.general.seg", { count: secs });
  if (secs === 0) return t("settings.general.min", { count: mins });
  return t("settings.general.minAndSeg", { min: mins, sec: secs });
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DurationPreset {
  label: string;
  sec: number;
}

export interface DurationFieldProps {
  /** Current value as "MM:SS" string */
  value: string;
  onChange: (value: string) => void;
  /** Optional label override; defaults to i18n key */
  label?: string;
  /** Icon element shown next to the label */
  icon?: React.ReactNode;
  /** Tailwind ring class for focus accent, e.g. "focus:ring-indigo-500" */
  accentRingClass?: string;
  /** Badge color classes when the preview badge is shown */
  badgeClass?: string;
  /** Quick-select presets shown below the input */
  presets?: DurationPreset[];
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Placeholder text; defaults to "00:00" */
  placeholder?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * A rich duration input field showing:
 * - Label + optional icon
 * - MM:SS text input with on-blur normalization
 * - A human-readable duration badge (e.g. "5 min")
 * - Optional quick-select preset chips
 */
export const DurationField: React.FC<DurationFieldProps> = ({
  value,
  onChange,
  label,
  icon,
  accentRingClass = "focus:ring-m3-primary/40",
  badgeClass = "text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
  presets,
  disabled = false,
  placeholder = "00:00",
}) => {
  const { t } = useI18n();
  const seconds = durationInputToSeconds(value);
  const resolvedLabel = label ?? t("serviceModals.duration.label");

  const handleBlur = () => {
    onChange(secondsToDurationInput(seconds));
  };

  return (
    <div className="space-y-2.5 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-m3-bg">
      {/* Header: label + live-preview badge */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
          {icon}
          {resolvedLabel}
        </label>
        <span
          className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${badgeClass}`}
        >
          {formatHumanDuration(seconds, t)}
        </span>
      </div>

      {/* MM:SS input */}
      <input
        type="text"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onBlur={handleBlur}
        className={`w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm px-3.5 py-2.5 font-mono tracking-widest text-center focus:outline-none focus:ring-2 ${accentRingClass} focus:border-m3-primary disabled:opacity-60 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 transition-colors`}
      />

      {/* Preset chips */}
      {presets && presets.length > 0 && !disabled && (
        <div className="flex items-center gap-1.5 pt-0.5">
          <span className="text-[11px] text-slate-400 font-medium shrink-0">
            {t("settings.general.suggestions")}
          </span>
          <div className="flex flex-wrap gap-1">
            {presets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => onChange(secondsToDurationInput(preset.sec))}
                className="px-2 py-0.5 text-xs font-mono rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-m3-primary dark:hover:border-m3-primary text-slate-600 dark:text-slate-300 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
