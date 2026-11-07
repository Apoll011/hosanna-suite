/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Surface } from "@/src/components/common";
import { SongScoreVisualizer } from "@/src/components/explorer/SongScoreVisualizer";
import { usePersonalSettings } from "@/src/hooks/usePersonalSettings";
import type { SongScoreLayout } from "@/src/hooks/usePersonalSettings";
import { useI18n } from "@/src/lib/i18n";
import { LANGUAGES } from "@/src/lib/i18n/languages";
import { PersonalLanguage } from "@/src/lib/i18n/types";
import { useCan } from "@/src/lib/permissions/client";
import {
  BarChart2,
  Check,
  FolderTree,
  Globe,
  Layout,
  MonitorSmartphone,
  Moon,
  Music2,
  Sliders,
  Smartphone,
  Star,
  Sun,
  User,
} from "lucide-react";
import React from "react";
import { useTheme } from "../../contexts/ThemeContext";

export interface AppearanceTabProps {
  active: boolean;
  showToast?: (
    text: string,
    variant: "success" | "error" | "info" | "warning",
  ) => void;
}

interface ThemeOption {
  id: "light" | "dark" | "system";
  title: string;
  description: string;
  icon: React.ElementType;
  previewBg: string;
}

export const AppearanceTab: React.FC<AppearanceTabProps> = ({
  active,
  showToast,
}) => {
  const { theme, setTheme } = useTheme();
  const { settings, updateSetting } = usePersonalSettings();
  const { t, personalLanguage, setPersonalLanguage } = useI18n();
  const { granted: canViewLibraryHealth } = useCan("library.health");

  if (!active) return null;

  const themes: ThemeOption[] = [
    {
      id: "light",
      title: t("settings.appearance.light"),
      description: t("settings.appearance.lightDesc"),
      icon: Sun,
      previewBg:
        "from-amber-500/10 to-orange-500/5 text-amber-600 dark:text-amber-400",
    },
    {
      id: "system",
      title: t("settings.appearance.auto"),
      description: t("settings.appearance.autoDesc"),
      icon: MonitorSmartphone,
      previewBg: "from-m3-secondary/10 to-m3-secondary/5 text-m3-secondary",
    },
    {
      id: "dark",
      title: t("settings.appearance.dark"),
      description: t("settings.appearance.darkDesc"),
      icon: Moon,
      previewBg: "from-m3-primary/10 to-sky-500/5 text-m3-primary",
    },
  ];

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    const label =
      newTheme === "system"
        ? t("settings.appearance.auto")
        : newTheme === "light"
          ? t("settings.appearance.light")
          : t("settings.appearance.dark");
    showToast?.(t("settings.toast.themeChanged", { theme: label }), "info");
  };

  const handleFolderTreeToggle = (checked: boolean) => {
    updateSetting("showFolderTree", checked);
    showToast?.(
      checked
        ? t("settings.toast.folderTreeVisible")
        : t("settings.toast.folderTreeHidden"),
      "success",
    );
  };

  const handleStudioSettingsChange = (checked: boolean) => {
    updateSetting("showChordsDefault", checked);
    showToast?.(
      checked
        ? t("settings.toast.chordsVisible")
        : t("settings.toast.chordsHidden"),
      "success",
    );
  };

  const handleLanguageChange = (lang: PersonalLanguage) => {
    setPersonalLanguage(lang);
    const label =
      lang === "auto"
        ? t("settings.appearance.languageAuto")
        : (LANGUAGES.find((l) => l.code === lang)?.nativeLabel ?? lang);
    showToast?.(
      t("settings.toast.languageChanged", { language: label }),
      "info",
    );
  };

  const optionCard = (selected: boolean) =>
    `group relative rounded-[var(--radius-lg)] border p-4 text-left transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-m3-primary/50 ${
      selected
        ? "border-m3-primary bg-m3-primary/5 ring-2 ring-m3-primary/20 shadow-[var(--shadow-sm)]"
        : "border-m3-border hover:border-m3-primary/40 bg-m3-sidebar/40"
    }`;

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Surface>
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-title text-m3-text flex items-center gap-2">
              <MonitorSmartphone className="w-5 h-5 text-m3-primary" />
              {t("settings.appearance.themeTitle")}
            </h2>
            <p className="mt-1 text-muted">
              {t("settings.appearance.themeDesc")}
            </p>
          </div>
          <span className="text-caption bg-m3-sidebar text-m3-secondary px-3 py-1.5 rounded-[var(--radius-md)] flex items-center gap-1.5 shrink-0">
            <User className="w-3.5 h-3.5" />
            {t("settings.appearance.personalPreference")}
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {themes.map((item) => {
            const Icon = item.icon;
            const selected = theme === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleThemeChange(item.id)}
                aria-pressed={selected}
                className={`${optionCard(selected)} p-5`}
              >
                {selected && (
                  <div className="absolute top-4 right-4 h-5 w-5 rounded-full bg-m3-primary flex items-center justify-center shadow-[var(--shadow-sm)]">
                    <Check className="h-3.5 w-3.5 text-white stroke-[2.5]" />
                  </div>
                )}

                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`inline-flex rounded-[var(--radius-md)] p-2.5 bg-linear-to-br border border-m3-border/50 ${item.previewBg}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                <h3 className="font-semibold text-sm text-m3-text">
                  {item.title}
                </h3>
                <p className="mt-1 text-caption leading-relaxed">
                  {item.description}
                </p>
              </button>
            );
          })}
        </div>
      </Surface>

      <Surface>
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h3 className="text-title text-m3-text flex items-center gap-2">
              <Globe className="w-5 h-5 text-m3-primary" />
              {t("settings.appearance.languageTitle")}
            </h3>
            <p className="mt-1 text-muted">
              {t("settings.appearance.languageDesc")}
            </p>
          </div>
          <span className="text-caption bg-m3-sidebar text-m3-secondary px-3 py-1.5 rounded-[var(--radius-md)] flex items-center gap-1.5 shrink-0">
            <User className="w-3.5 h-3.5" />
            {t("settings.appearance.personalPreference")}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <button
            type="button"
            onClick={() => handleLanguageChange("auto")}
            aria-pressed={personalLanguage === "auto"}
            className={optionCard(personalLanguage === "auto")}
          >
            {personalLanguage === "auto" && (
              <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-m3-primary flex items-center justify-center">
                <Check className="h-3.5 w-3.5 text-white stroke-[2.5]" />
              </div>
            )}
            <div className="text-2xl mb-2" aria-hidden="true">
              🌐
            </div>
            <span className="block font-semibold text-sm text-m3-text">
              {t("settings.appearance.languageAuto")}
            </span>
            <span className="block mt-1 text-caption">
              {t("settings.appearance.languageAutoDesc")}
            </span>
          </button>

          {LANGUAGES.map((lang) => {
            const selected = personalLanguage === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleLanguageChange(lang.code)}
                aria-pressed={selected}
                className={optionCard(selected)}
              >
                {selected && (
                  <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-m3-primary flex items-center justify-center">
                    <Check className="h-3.5 w-3.5 text-white stroke-[2.5]" />
                  </div>
                )}
                <div className="text-2xl mb-2" aria-hidden="true">
                  {lang.flag}
                </div>
                <span className="block font-semibold text-sm text-m3-text">
                  {lang.nativeLabel}
                </span>
                <span className="block mt-1 text-caption">
                  {lang.englishLabel}
                </span>
              </button>
            );
          })}
        </div>
      </Surface>

      <Surface>
        <div className="mb-6">
          <h3 className="text-title text-m3-text flex items-center gap-2">
            <Sliders className="w-5 h-5 text-m3-primary" />
            {t("settings.appearance.navigationTitle")}
          </h3>
          <p className="text-muted mt-1">
            {t("settings.appearance.navigationDesc")}
          </p>
        </div>

        <label className="flex items-start gap-4 p-4 border border-m3-border rounded-[var(--radius-md)] cursor-pointer hover:bg-m3-sidebar/80 transition-colors">
          <div className="flex items-center h-5 mt-0.5">
            <input
              type="checkbox"
              checked={settings.showFolderTree}
              onChange={(e) => handleFolderTreeToggle(e.target.checked)}
              className="w-4.5 h-4.5 text-m3-primary border-m3-border rounded focus:ring-m3-primary cursor-pointer"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-m3-text flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-m3-secondary" />
              {t("settings.appearance.showFolderTree")}
            </span>
            <p className="text-caption mt-1">
              {t("settings.appearance.showFolderTreeDesc")}
            </p>
          </div>
        </label>
      </Surface>

      <Surface>
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h3 className="text-title text-m3-text flex items-center gap-2">
              <Layout className="w-5 h-5 text-m3-primary" />
              {t("settings.appearance.studioTitle")}
            </h3>
            <p className="text-muted mt-1">
              {t("settings.appearance.studioDesc")}
            </p>
          </div>
          <span className="text-caption bg-m3-sidebar text-m3-secondary px-3 py-1.5 rounded-[var(--radius-md)] flex items-center gap-1.5 shrink-0">
            <Smartphone className="w-3.5 h-3.5" />
            {t("settings.appearance.onDevice")}
          </span>
        </div>

        <label className="flex items-start gap-4 p-4 border border-m3-border rounded-[var(--radius-md)] cursor-pointer hover:bg-m3-sidebar/80 transition-colors">
          <div className="flex items-center h-5 mt-0.5">
            <input
              type="checkbox"
              checked={settings.showChordsDefault}
              onChange={(e) => handleStudioSettingsChange(e.target.checked)}
              className="w-4.5 h-4.5 text-m3-primary border-m3-border rounded focus:ring-m3-primary cursor-pointer"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-m3-text flex items-center gap-2">
              <Music2 className="w-4 h-4 text-m3-secondary" />
              {t("settings.appearance.showChords")}
            </span>
            <p className="text-caption mt-1 leading-relaxed">
              {t("settings.appearance.showChordsDesc")}
            </p>
          </div>
        </label>
      </Surface>

      {canViewLibraryHealth && (
        <Surface>
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h3 className="text-title text-m3-text flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                {t("settings.appearance.songScoreTitle")}
              </h3>
              <p className="text-muted mt-1">
                {t("settings.appearance.songScoreDesc")}
              </p>
            </div>
            <span className="text-caption bg-m3-sidebar text-m3-secondary px-3 py-1.5 rounded-[var(--radius-md)] flex items-center gap-1.5 shrink-0">
              <BarChart2 className="w-3.5 h-3.5" />
              {t("settings.appearance.songScoreBadge")}
            </span>
          </div>

          <div className="space-y-5">
            <label className="flex items-start gap-4 p-4 border border-m3-border rounded-[var(--radius-md)] cursor-pointer hover:bg-m3-sidebar/80 transition-colors">
              <div className="flex items-center h-5 mt-0.5">
                <input
                  type="checkbox"
                  checked={settings.showSongScore}
                  onChange={(e) =>
                    updateSetting("showSongScore", e.target.checked)
                  }
                  className="w-4.5 h-4.5 text-amber-500 border-m3-border rounded focus:ring-amber-400 cursor-pointer"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-m3-text flex items-center gap-2">
                  <Star className="w-4 h-4 text-m3-secondary" />
                  {t("settings.appearance.showSongScore")}
                </span>
                <p className="text-caption mt-1 leading-relaxed">
                  {t("settings.appearance.showSongScoreDesc")}
                </p>
              </div>
            </label>

            {settings.showSongScore && (
              <div>
                <p className="text-label mb-3">
                  {t("settings.appearance.songScoreStyle")}
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {(
                    [
                      {
                        id: "ring" as SongScoreLayout,
                        label: t("settings.appearance.scoreLayout.ring"),
                        desc: t("settings.appearance.scoreLayout.ringDesc"),
                      },
                      {
                        id: "bar" as SongScoreLayout,
                        label: t("settings.appearance.scoreLayout.bar"),
                        desc: t("settings.appearance.scoreLayout.barDesc"),
                      },
                      {
                        id: "dots" as SongScoreLayout,
                        label: t("settings.appearance.scoreLayout.dots"),
                        desc: t("settings.appearance.scoreLayout.dotsDesc"),
                      },
                      {
                        id: "badge" as SongScoreLayout,
                        label: t("settings.appearance.scoreLayout.badge"),
                        desc: t("settings.appearance.scoreLayout.badgeDesc"),
                      },
                    ] as const
                  ).map((opt) => {
                    const selected = settings.songScoreLayout === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => updateSetting("songScoreLayout", opt.id)}
                        aria-pressed={selected}
                        className={`group relative rounded-[var(--radius-lg)] border p-4 text-left transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400/50 ${
                          selected
                            ? "border-amber-400 bg-amber-50/60 dark:bg-amber-400/5 ring-2 ring-amber-400/25 shadow-[var(--shadow-sm)]"
                            : "border-m3-border hover:border-m3-primary/40 bg-m3-sidebar/40"
                        }`}
                      >
                        {selected && (
                          <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-amber-400 flex items-center justify-center shadow-[var(--shadow-sm)]">
                            <Check className="h-3.5 w-3.5 text-white stroke-[2.5]" />
                          </div>
                        )}

                        <div className="flex items-center justify-center mb-3 h-10">
                          <SongScoreVisualizer
                            score={74}
                            layout={opt.id}
                            compact
                          />
                        </div>

                        <span className="block font-semibold text-sm text-m3-text">
                          {opt.label}
                        </span>
                        <span className="block mt-1 text-caption leading-relaxed">
                          {opt.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </Surface>
      )}
    </div>
  );
};
