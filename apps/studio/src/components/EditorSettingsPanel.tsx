// SPDX-License-Identifier: AGPL-3.0-only
import { TranslationKey, useI18n } from "@/src/lib/i18n";
import { RotateCcw, X } from "lucide-react";
import React, { useMemo } from "react";
import { EDITOR_THEMES, useEditorSettings } from "../hooks/useEditorSettings";
import { Button, SpringDropdown, usePresence, type SpringDropdownOption } from "@hosanna/ui";
export interface EditorSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings?: ReturnType<typeof useEditorSettings>["settings"];
  updateSetting?: ReturnType<typeof useEditorSettings>["updateSetting"];
  resetSettings?: ReturnType<typeof useEditorSettings>["resetSettings"];
}

export const EditorSettingsPanel: React.FC<EditorSettingsPanelProps> = ({
  isOpen,
  onClose,
  settings: propSettings,
  updateSetting: propUpdateSetting,
  resetSettings: propResetSettings,
}) => {
  const hookState = useEditorSettings();
  const settings = propSettings ?? hookState.settings;
  const updateSetting = propUpdateSetting ?? hookState.updateSetting;
  const resetSettings = propResetSettings ?? hookState.resetSettings;
  const { t } = useI18n();
  const panelMounted = usePresence(isOpen);
  const getThemeLabel = (themeValue: string, defaultLabel: string) => {
    try {
      const key = `misc.editorSettings.themes.${themeValue}` as TranslationKey;
      const translated = t(key);
      if (translated && translated !== key) return translated;
    } catch {
      return defaultLabel;
    }
    return defaultLabel;
  };
  const themeOptions = useMemo<SpringDropdownOption<string>[]>(
    () => EDITOR_THEMES.map((theme) => ({
      id: theme.value,
      label: getThemeLabel(theme.value, theme.label),
    })),
    [t],
  );

  if (!panelMounted) return null;

  return (
    <div
      aria-hidden={!isOpen}
      inert={!isOpen}
      className={`absolute right-2 top-11 w-80 bg-m3-card dark:bg-m3-dark-card border border-m3-border dark:border-m3-dark-border rounded-xl shadow-2xl p-4 z-50 space-y-4 [--hosanna-origin:top_right] ${isOpen ? "hosanna-surface-enter" : "hosanna-surface-exit"}`}
    >
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-m3-primary">
          {t("misc.editorSettings.title")}
        </h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          {t("misc.editorSettings.theme")}
        </label>
        <SpringDropdown
          mode="single"
          options={themeOptions}
          selected={settings.theme}
          onChange={(value) => updateSetting("theme", value)}
          ariaLabel={t("misc.editorSettings.theme")}
          className="h-10 w-full justify-between text-xs"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          {t("misc.editorSettings.fontSize", { size: settings.fontSize })}
        </label>
        <input
          type="range"
          min={10}
          max={24}
          step={1}
          value={settings.fontSize}
          onChange={(e) => updateSetting("fontSize", Number(e.target.value))}
          className="w-full accent-m3-primary cursor-pointer"
        />
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-3.5 p-3 border border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
          <input
            type="checkbox"
            checked={settings.wordWrap}
            onChange={(e) => updateSetting("wordWrap", e.target.checked)}
            className="w-4 h-4 text-m3-primary rounded-md focus:ring-m3-primary cursor-pointer"
          />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
              {t("misc.editorSettings.wordWrap")}
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {t("misc.editorSettings.wordWrapDesc")}
            </p>
          </div>
        </label>

        <label className="flex items-center gap-3.5 p-3 border border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
          <input
            type="checkbox"
            checked={settings.showLineNumbers}
            onChange={(e) => updateSetting("showLineNumbers", e.target.checked)}
            className="w-4 h-4 text-m3-primary rounded-md focus:ring-m3-primary cursor-pointer"
          />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
              {t("misc.editorSettings.showLineNumbers")}
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {t("misc.editorSettings.showLineNumbersDesc")}
            </p>
          </div>
        </label>
      </div>

      <div className="flex items-center justify-end pt-1">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          icon={<RotateCcw className="w-3.5 h-3.5" />}
          onClick={resetSettings}
        >
          {t("misc.editorSettings.resetTitle")}
        </Button>
      </div>
    </div>
  );
};
