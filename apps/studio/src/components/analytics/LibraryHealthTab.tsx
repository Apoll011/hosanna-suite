/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Spinner, Surface } from "@hosanna/ui";
import { SongScoreVisualizer } from "@/src/components/explorer/SongScoreVisualizer";
import { useSync } from "@/src/contexts/SyncContext";
import { useAppNavigate } from "@/src/hooks/useAppNavigate";
import { useAllSongs } from "@/src/hooks/useSongs";
import { useI18n } from "@/src/lib/i18n";
import {
  applyLibraryHealthAutoFixes,
  computeLibraryHealth,
  type ScoreMissingCriterion,
} from "@/src/lib/libraryHealth";
import { useCan } from "@/src/lib/permissions/client";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  HeartPulse,
  Music2,
  WandSparkles,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { useParams } from "react-router-dom";

export interface LibraryHealthTabProps {
  active: boolean;
}

function criterionLabel(
  t: (key: `analytics.libraryHealth.criteria.${ScoreMissingCriterion}`) => string,
  criterion: ScoreMissingCriterion,
): string {
  return t(`analytics.libraryHealth.criteria.${criterion}`);
}

export const LibraryHealthTab: React.FC<LibraryHealthTabProps> = ({ active }) => {
  const { t } = useI18n();
  const { showToast } = useSync();
  const { navigate } = useAppNavigate();
  const { slug } = useParams<{ slug: string }>();
  const slugPrefix = slug ? `/${slug}` : "";
  const { songsQuery } = useAllSongs();
  const { granted: canUpdateSong } = useCan("song.update");
  const songs = useMemo(() => songsQuery.data?.songs ?? [], [songsQuery.data?.songs]);
  const isLoading = songsQuery.isLoading;

  const summary = useMemo(() => computeLibraryHealth(songs), [songs]);
  const [expanded, setExpanded] = useState<Set<ScoreMissingCriterion>>(() => new Set());
  const [fixingKey, setFixingKey] = useState<string | null>(null);

  if (!active) return null;

  const toggleCategory = (criterion: ScoreMissingCriterion) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(criterion)) next.delete(criterion);
      else next.add(criterion);
      return next;
    });
  };

  const openSong = (songId: string) => {
    navigate(`${slugPrefix}/songs/${songId}`);
  };

  const runAutoFix = async (
    key: string,
    opts: {
      criterion: ScoreMissingCriterion;
      songIds?: string[];
    },
  ) => {
    if (!canUpdateSong || fixingKey) return;
    setFixingKey(key);
    try {
      const result = await applyLibraryHealthAutoFixes(songs, opts);
      if (result.fixed > 0) {
        showToast(
          t("analytics.libraryHealth.autoFixSuccess", {
            count: result.fixed,
          }),
          "success",
        );
      } else {
        showToast(t("analytics.libraryHealth.autoFixNone"), "info");
      }
    } catch {
      showToast(t("analytics.libraryHealth.autoFixError"), "error");
    } finally {
      setFixingKey(null);
    }
  };

  const healthTone =
    summary.healthPercentage >= 80
      ? {
          text: "text-emerald-600 dark:text-emerald-400",
          ring: "stroke-emerald-500",
          soft: "from-emerald-500/12 via-transparent to-transparent",
          badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
          bar: "bg-emerald-500",
        }
      : summary.healthPercentage >= 55
        ? {
            text: "text-amber-600 dark:text-amber-400",
            ring: "stroke-amber-500",
            soft: "from-amber-500/12 via-transparent to-transparent",
            badge: "bg-amber-500/15 text-amber-800 dark:text-amber-200",
            bar: "bg-amber-500",
          }
        : {
            text: "text-rose-600 dark:text-rose-400",
            ring: "stroke-rose-500",
            soft: "from-rose-500/12 via-transparent to-transparent",
            badge: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
            bar: "bg-rose-500",
          };

  const healthyShare =
    summary.songCount > 0 ? Math.round((summary.healthyCount / summary.songCount) * 100) : 0;
  const issueShare =
    summary.songCount > 0 ? Math.round((summary.issueCount / summary.songCount) * 100) : 0;

  if (isLoading && songs.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" label={t("common.loading")} />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:items-stretch">
        <Surface padding="none" className="relative overflow-hidden h-full">
          <div
            className={`absolute inset-0 bg-linear-to-br ${healthTone.soft} pointer-events-none`}
          />
          <div className="relative p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-5 h-full">
            <div className="relative w-32 h-32 sm:w-36 sm:h-36 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  strokeWidth="10"
                  className="stroke-m3-border/70"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  strokeWidth="10"
                  strokeLinecap="round"
                  className={healthTone.ring}
                  strokeDasharray={`${(summary.healthPercentage / 100) * 326.73} 326.73`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-semibold tabular-nums tracking-tight ${healthTone.text}`}>
                  {summary.healthPercentage}%
                </span>
                <span className="text-caption mt-0.5">
                  {t("analytics.libraryHealth.healthLabel")}
                </span>
              </div>
            </div>

            <div className="min-w-0 flex-1 text-center sm:text-left space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-title text-m3-text flex items-center justify-center sm:justify-start gap-2">
                    <HeartPulse className="w-5 h-5 text-m3-primary shrink-0" />
                    {t("analytics.libraryHealth.title")}
                  </h2>
                  <p className="mt-1 text-muted">{t("analytics.libraryHealth.desc")}</p>
                </div>
                <span
                  className={`inline-flex self-center sm:self-start items-center rounded-full px-2.5 py-1 text-xs font-semibold shrink-0 ${healthTone.badge}`}
                >
                  {summary.healthPercentage >= 80
                    ? t("analytics.libraryHealth.statHealthy")
                    : t("analytics.libraryHealth.statIssues")}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-caption">
                  <span>{t("analytics.libraryHealth.statHealthy")}</span>
                  <span className="tabular-nums font-medium text-m3-text">{healthyShare}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-m3-sidebar overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-[width] duration-500 ${healthTone.bar}`}
                    style={{ width: `${Math.max(healthyShare, healthyShare > 0 ? 2 : 0)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </Surface>

        <Surface padding="none" className="overflow-hidden h-full">
          <div className="flex flex-col h-full divide-y divide-m3-border">
            <div className="flex-1 flex items-center gap-3 px-4 py-2.5">
              <div className="w-10 h-10 rounded-lg bg-m3-primary/10 text-m3-primary flex items-center justify-center shrink-0">
                <Music2 className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-caption block">
                  {t("analytics.libraryHealth.statSongs")}
                </span>
                <span className="block text-2xl font-semibold tabular-nums tracking-tight text-m3-text leading-tight">
                  {summary.songCount}
                </span>
              </div>
            </div>

            <div className="flex-1 flex items-center gap-3 px-4 py-2.5">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-caption">
                    {t("analytics.libraryHealth.statHealthy")}
                  </span>
                  <span className="text-caption tabular-nums font-medium text-emerald-600 dark:text-emerald-400">
                    {healthyShare}%
                  </span>
                </div>
                <span className="block text-2xl font-semibold tabular-nums tracking-tight text-emerald-600 dark:text-emerald-400 leading-tight">
                  {summary.healthyCount}
                </span>
              </div>
            </div>

            <div className="flex-1 flex items-center gap-3 px-4 py-2.5">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-caption">{t("analytics.libraryHealth.statIssues")}</span>
                  <span className="text-caption tabular-nums font-medium text-amber-600 dark:text-amber-400">
                    {issueShare}%
                  </span>
                </div>
                <span className="block text-2xl font-semibold tabular-nums tracking-tight text-amber-600 dark:text-amber-400 leading-tight">
                  {summary.issueCount}
                </span>
              </div>
            </div>
          </div>
        </Surface>
      </div>

      <Surface padding="none" className="overflow-hidden">
        <div className="px-6 py-5 border-b border-m3-border">
          <h3 className="text-title text-m3-text flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            {t("analytics.libraryHealth.issuesTitle")}
          </h3>
          <p className="mt-1 text-muted">{t("analytics.libraryHealth.issuesDesc")}</p>
        </div>

        <div className="divide-y divide-m3-border">
          {summary.categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              <div>
                <p className="text-sm font-semibold text-m3-text">
                  {t("analytics.libraryHealth.allHealthyTitle")}
                </p>
                <p className="mt-1 text-caption">{t("analytics.libraryHealth.allHealthyDesc")}</p>
              </div>
            </div>
          ) : (
            summary.categories.map((category) => {
              const isOpen = expanded.has(category.criterion);
              const categoryFixKey = `cat:${category.criterion}`;
              const showFixAll = canUpdateSong && category.autoFixableCount > 0;

              return (
                <div key={category.criterion}>
                  <div className="flex items-center gap-2 px-3 sm:px-4">
                    <button
                      type="button"
                      onClick={() => toggleCategory(category.criterion)}
                      className="flex-1 flex items-center justify-between gap-3 px-3 py-4 text-left hover:bg-m3-sidebar/80 rounded-md transition-colors cursor-pointer min-w-0"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {isOpen ? (
                          <ChevronDown className="w-4 h-4 text-m3-secondary shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-m3-secondary shrink-0" />
                        )}
                        <div className="min-w-0">
                          <span className="block text-sm font-semibold text-m3-text">
                            {criterionLabel(t, category.criterion)}
                          </span>
                          <span className="block text-xs text-m3-secondary mt-0.5">
                            {t("analytics.libraryHealth.affectedCount", {
                              count: category.songs.length,
                            })}
                            {category.autoFixableCount > 0 && (
                              <>
                                {" · "}
                                {t("analytics.libraryHealth.autoFixableCount", {
                                  count: category.autoFixableCount,
                                })}
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-semibold tabular-nums px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 shrink-0">
                        {category.songs.length}
                      </span>
                    </button>

                    {showFixAll && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        isLoading={fixingKey === categoryFixKey}
                        disabled={Boolean(fixingKey)}
                        icon={<WandSparkles className="w-3.5 h-3.5" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          void runAutoFix(categoryFixKey, {
                            criterion: category.criterion,
                            songIds: category.songs.filter((s) => s.autoFixable).map((s) => s.id),
                          });
                        }}
                      >
                        {t("analytics.libraryHealth.autoFixAll")}
                      </Button>
                    )}
                  </div>

                  {isOpen && (
                    <ul className="pb-3 px-3 sm:px-6 space-y-1">
                      {category.songs.map((song) => {
                        const songFixKey = `song:${category.criterion}:${song.id}`;
                        return (
                          <li key={`${category.criterion}-${song.id}`}>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => openSong(song.id)}
                                className="flex-1 flex items-center gap-3 px-3 py-2.5 rounded-md text-left hover:bg-m3-primary/5 border border-transparent hover:border-m3-primary/20 transition-colors cursor-pointer group min-w-0"
                              >
                                <div className="w-8 h-8 rounded-md bg-m3-sidebar flex items-center justify-center shrink-0 group-hover:bg-m3-primary/10">
                                  <Music2 className="w-4 h-4 text-m3-secondary group-hover:text-m3-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="block text-sm font-semibold text-m3-text truncate">
                                    {song.title}
                                  </span>
                                  {song.artist && (
                                    <span className="block text-xs text-m3-secondary truncate">
                                      {song.artist}
                                    </span>
                                  )}
                                </div>
                                <SongScoreVisualizer score={song.score} layout="badge" compact />
                                <ChevronRight className="w-4 h-4 text-m3-secondary/50 group-hover:text-m3-primary shrink-0" />
                              </button>

                              {canUpdateSong && song.autoFixable && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  isLoading={fixingKey === songFixKey}
                                  disabled={Boolean(fixingKey)}
                                  icon={<WandSparkles className="w-3.5 h-3.5" />}
                                  title={t("analytics.libraryHealth.autoFix")}
                                  onClick={() =>
                                    void runAutoFix(songFixKey, {
                                      criterion: category.criterion,
                                      songIds: [song.id],
                                    })
                                  }
                                >
                                  {t("analytics.libraryHealth.autoFix")}
                                </Button>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Surface>
    </div>
  );
};
