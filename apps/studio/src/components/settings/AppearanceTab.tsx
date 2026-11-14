/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Surface, useCan } from "@hosanna/ui";
import { SongScoreVisualizer } from "@/src/components/explorer/SongScoreVisualizer";
import type { SongScoreLayout } from "@/src/hooks/usePersonalSettings";
import { useStudioSettings } from "@/src/hooks/usePersonalSettings";
import { useI18n } from "@/src/lib/i18n";

import {
  BarChart2,
  Check,
  FolderTree,
  Layout,
  Music2,
  Sliders,
  Smartphone,
  Star,
} from "lucide-react";
import React from "react";

export interface AppearanceTabProps {
  active: boolean;
  showToast?: (text: string, variant: "success" | "error" | "info" | "warning") => void;
}

export const AppearanceTab: React.FC<AppearanceTabProps> = ({ active, showToast }) => {
  const { settings, updateSetting } = useStudioSettings();
  const { t } = useI18n();
  const { granted: canViewLibraryHealth } = useCan("library.health");

  if (!active) return null;

  const handleFolderTreeToggle = (checked: boolean) => {
    updateSetting("showFolderTree", checked);
    showToast?.(
      checked ? t("settings.toast.folderTreeVisible") : t("settings.toast.folderTreeHidden"),
      "success",
    );
  };

  const handleStudioSettingsChange = (checked: boolean) => {
    updateSetting("showChordsDefault", checked);
    showToast?.(
      checked ? t("settings.toast.chordsVisible") : t("settings.toast.chordsHidden"),
      "success",
    );
  };

  return (
    <div className="space-y-6 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Surface className="h-full">
          <div className="mb-6">
            <h3 className="text-title text-m3-text flex items-center gap-2">
              <Sliders className="w-5 h-5 text-m3-primary" />
              {t("settings.appearance.navigationTitle")}
            </h3>
            <p className="text-muted mt-1">{t("settings.appearance.navigationDesc")}</p>
          </div>

          <label className="flex items-start gap-4 p-4 border border-m3-border rounded-md cursor-pointer hover:bg-m3-sidebar/80 transition-colors">
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
              <p className="text-caption mt-1">{t("settings.appearance.showFolderTreeDesc")}</p>
            </div>
          </label>
        </Surface>

        <Surface className="h-full">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h3 className="text-title text-m3-text flex items-center gap-2">
                <Layout className="w-5 h-5 text-m3-primary" />
                {t("settings.appearance.studioTitle")}
              </h3>
              <p className="text-muted mt-1">{t("settings.appearance.studioDesc")}</p>
            </div>
            <span className="text-caption bg-m3-sidebar text-m3-secondary px-3 py-1.5 rounded-md flex items-center gap-1.5 shrink-0">
              <Smartphone className="w-3.5 h-3.5" />
              {t("settings.appearance.onDevice")}
            </span>
          </div>

          <label className="flex items-start gap-4 p-4 border border-m3-border rounded-md cursor-pointer hover:bg-m3-sidebar/80 transition-colors">
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
      </div>

      {canViewLibraryHealth && (
        <Surface>
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h3 className="text-title text-m3-text flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                {t("settings.appearance.songScoreTitle")}
              </h3>
              <p className="text-muted mt-1">{t("settings.appearance.songScoreDesc")}</p>
            </div>
            <span className="text-caption bg-m3-sidebar text-m3-secondary px-3 py-1.5 rounded-md flex items-center gap-1.5 shrink-0">
              <BarChart2 className="w-3.5 h-3.5" />
              {t("settings.appearance.songScoreBadge")}
            </span>
          </div>

          <div className="space-y-5">
            <label className="flex items-start gap-4 p-4 border border-m3-border rounded-md cursor-pointer hover:bg-m3-sidebar/80 transition-colors">
              <div className="flex items-center h-5 mt-0.5">
                <input
                  type="checkbox"
                  checked={settings.showSongScore}
                  onChange={(e) => updateSetting("showSongScore", e.target.checked)}
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
                <p className="text-label mb-3">{t("settings.appearance.songScoreStyle")}</p>
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
                        className={`group relative rounded-lg border p-4 text-left transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400/50 ${
                          selected
                            ? "border-amber-400 bg-amber-50/60 dark:bg-amber-400/5 ring-2 ring-amber-400/25 shadow-sm"
                            : "border-m3-border hover:border-m3-primary/40 bg-m3-sidebar/40"
                        }`}
                      >
                        {selected && (
                          <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-amber-400 flex items-center justify-center shadow-sm">
                            <Check className="h-3.5 w-3.5 text-white stroke-[2.5]" />
                          </div>
                        )}

                        <div className="flex items-center justify-center mb-3 h-10">
                          <SongScoreVisualizer score={74} layout={opt.id} compact />
                        </div>

                        <span className="block font-semibold text-sm text-m3-text">
                          {opt.label}
                        </span>
                        <span className="block mt-1 text-caption leading-relaxed">{opt.desc}</span>
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
