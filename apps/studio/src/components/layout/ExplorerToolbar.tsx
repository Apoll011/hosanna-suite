/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button } from "@/src/components/common";
import { useI18n } from "@/src/lib/i18n";
import { Can } from "@/src/lib/permissions/components";
import { Service } from "@/src/types";
import {
  Archive,
  ArrowUpDown,
  Edit2,
  Filter,
  LayoutGrid,
  List,
  MoreHorizontal,
  Plus,
  Printer,
  Trash2,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { ViewName } from "../../layouts/view";

export interface CollectionToolbarActions {
  onAddSongs: () => void;
  onPrint: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

interface ExplorerToolbarProps {
  view: ViewName;
  activeFiltersCount: number;
  showArchived: boolean;
  setShowArchived: React.Dispatch<React.SetStateAction<boolean>>;
  archivedServices: Service[];
  sortBy: "title" | "artist" | "updatedAt" | "number";
  sortOrder: "asc" | "desc";
  onSortChange: (
    sb: "title" | "artist" | "updatedAt" | "number",
    so: "asc" | "desc",
  ) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  density: "comfortable" | "compact";
  onDensityChange: (d: "comfortable" | "compact") => void;
  onOpenFilterPanel: () => void;
  collectionActions?: CollectionToolbarActions | null;
}

const MENU_ITEM =
  "w-full flex items-center gap-2.5 px-3 py-2 min-h-10 rounded-[var(--radius-md)] text-m3-text hover:bg-m3-hover font-medium transition-colors text-left cursor-pointer";
const MENU_ITEM_DANGER =
  "w-full flex items-center gap-2.5 px-3 py-2 min-h-10 rounded-[var(--radius-md)] text-m3-danger hover:bg-m3-danger/10 font-semibold transition-colors text-left cursor-pointer";
const MENU_ICON = "w-4 h-4 text-m3-secondary shrink-0";

export const ExplorerToolbar: React.FC<ExplorerToolbarProps> = ({
  view,
  activeFiltersCount,
  showArchived,
  setShowArchived,
  archivedServices,
  sortBy,
  sortOrder,
  onSortChange,
  viewMode,
  onViewModeChange,
  density,
  onDensityChange,
  onOpenFilterPanel,
  collectionActions = null,
}) => {
  const { t } = useI18n();
  const [isCollectionMenuOpen, setIsCollectionMenuOpen] = useState(false);
  const collectionMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isCollectionMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (
        collectionMenuRef.current &&
        !collectionMenuRef.current.contains(e.target as Node)
      ) {
        setIsCollectionMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [isCollectionMenuOpen]);

  useEffect(() => {
    setIsCollectionMenuOpen(false);
  }, [view, collectionActions]);

  if (
    view !== "explorer" &&
    view !== "services" &&
    view !== "songs" &&
    view !== "collections" &&
    view !== "collection-detail"
  )
    return null;

  return (
    <div className="px-4 py-2.5 bg-m3-sidebar/20 border-b border-m3-border/40 flex items-center justify-between gap-3 flex-wrap">
      {/* Left Side: Filter button, Archive button (services), Sort dropdown */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Sort Control Button */}
        <div className="flex items-center gap-2 bg-m3-bg border border-m3-border rounded-md px-3 py-1.5 min-h-10 text-xs transition-colors hover:border-m3-primary/30">
          <ArrowUpDown className="w-4 h-4 text-m3-secondary shrink-0" />
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split("-") as [
                "title" | "artist" | "updatedAt" | "number",
                "asc" | "desc",
              ];
              onSortChange(sb, so);
            }}
            className="bg-transparent font-medium text-m3-text cursor-pointer text-(length:--text-label)"
            title={
              view === "services"
                ? t("toolbar.sortServices")
                : t("toolbar.sortFiles")
            }
          >
            {view === "services" ? (
              <>
                <option
                  value={`${sortBy !== "title" ? sortBy : "updatedAt"}-desc`}
                >
                  {t("toolbar.dateDesc")}
                </option>
                <option
                  value={`${sortBy !== "title" ? sortBy : "updatedAt"}-asc`}
                >
                  {t("toolbar.dateAsc")}
                </option>
                <option value="title-asc">{t("toolbar.nameAsc")}</option>
                <option value="title-desc">{t("toolbar.nameDesc")}</option>
              </>
            ) : view === "collections" ? (
              <>
                <option value="number-asc">{t("toolbar.songNumberAsc")}</option>
                <option value="number-desc">
                  {t("toolbar.songNumberDesc")}
                </option>
                <option value="title-asc">{t("toolbar.nameAsc")}</option>
                <option value="title-desc">{t("toolbar.nameDesc")}</option>
                <option value="updatedAt-asc">{t("toolbar.dateAsc")}</option>
                <option value="updatedAt-desc">{t("toolbar.dateDesc")}</option>
              </>
            ) : (
              <>
                <option value="number-asc">{t("toolbar.numberAsc")}</option>
                <option value="number-desc">{t("toolbar.numberDesc")}</option>
                <option value="title-asc">{t("toolbar.nameAsc")}</option>
                <option value="title-desc">{t("toolbar.nameDesc")}</option>
                <option value="artist-asc">{t("toolbar.artistAsc")}</option>
                <option value="artist-desc">{t("toolbar.artistDesc")}</option>
                <option value="updatedAt-asc">{t("toolbar.dateAsc")}</option>
                <option value="updatedAt-desc">{t("toolbar.dateDesc")}</option>
              </>
            )}
          </select>
        </div>

        {/* Filter Pop-Up Panel Trigger Button */}
        {(view === "explorer" ||
          view === "songs" ||
          view === "collection-detail") && (
          <button
            onClick={onOpenFilterPanel}
            className={`flex items-center gap-2 px-4 py-1.5 min-h-10 rounded-md border text-label transition-colors cursor-pointer relative ${
              activeFiltersCount > 0
                ? "bg-m3-primary/10 border-m3-primary/30 text-m3-primary"
                : "bg-m3-card border-m3-border text-m3-secondary hover:bg-m3-hover hover:text-m3-text hover:border-m3-primary/30"
            }`}
            title={t("toolbar.openFilters")}
          >
            <Filter className="w-4 h-4" />
            <span>{t("toolbar.filters")}</span>
            {activeFiltersCount > 0 && (
              <span className="w-4.5 h-4.5 rounded-full bg-m3-primary text-white text-[10px] font-semibold flex items-center justify-center shadow-sm">
                {activeFiltersCount}
              </span>
            )}
          </button>
        )}

        {/* Archive Toggle Button (Services View) */}
        {view === "services" && (
          <button
            type="button"
            onClick={() => setShowArchived((v) => !v)}
            className={`flex items-center gap-2 px-4 py-1.5 min-h-10 rounded-md border text-label transition-colors cursor-pointer shrink-0 ${
              showArchived
                ? "bg-m3-primary/10 border-m3-primary/30 text-m3-primary"
                : "bg-m3-card border-m3-border text-m3-secondary hover:bg-m3-hover hover:text-m3-text hover:border-m3-primary/30"
            }`}
            title={
              showArchived
                ? t("toolbar.hideArchived")
                : t("toolbar.showArchived")
            }
          >
            <Archive className="w-4 h-4" />
            <span>{t("toolbar.archived")}</span>
            {showArchived && archivedServices.length > 0 && (
              <span className="w-4.5 h-4.5 rounded-full bg-m3-primary text-white text-[10px] font-semibold flex items-center justify-center">
                {archivedServices.length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Right Side: Collection actions / View Mode / Density */}
      <div className="flex items-center gap-2.5">
        {view === "collection-detail" && collectionActions && (
          <div ref={collectionMenuRef} className="relative shrink-0">
            <button
              type="button"
              data-collection-context-menu
              onClick={() => setIsCollectionMenuOpen((v) => !v)}
              className="p-2 min-h-10 min-w-10 inline-flex items-center justify-center rounded-md border border-m3-border bg-m3-card text-m3-secondary hover:text-m3-text hover:bg-m3-hover transition-colors cursor-pointer"
              title={t("explorer.moreOptions")}
              aria-expanded={isCollectionMenuOpen}
              aria-haspopup="menu"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {isCollectionMenuOpen && (
              <div
                data-collection-context-menu
                role="menu"
                className="absolute right-0 top-full mt-2 w-52 bg-m3-card border border-m3-border rounded-xl shadow-lg z-50 p-1.5 space-y-0.5 hosanna-enter"
              >
                <Can permission="export.pdf">
                  <button
                    type="button"
                    className={MENU_ITEM}
                    onClick={() => {
                      setIsCollectionMenuOpen(false);
                      collectionActions.onPrint();
                    }}
                  >
                    <Printer className={MENU_ICON} />
                    {t("print.buttons.printCollection")}
                  </button>
                </Can>
                <Can permission="collection.update">
                  <button
                    type="button"
                    className={MENU_ITEM}
                    onClick={() => {
                      setIsCollectionMenuOpen(false);
                      collectionActions.onEdit();
                    }}
                  >
                    <Edit2 className={MENU_ICON} />
                    {t("collectionsPage.editCollection")}
                  </button>
                </Can>
                <Can permission="collection.update">
                  <button
                    type="button"
                    className={MENU_ITEM}
                    onClick={() => {
                      setIsCollectionMenuOpen(false);
                      collectionActions.onAddSongs();
                    }}
                  >
                    <Plus className={MENU_ICON} />
                    {t("collectionsPage.addSongs")}
                  </button>
                </Can>
                <Can permission="collection.delete">
                  <div className="my-1 h-px bg-m3-border mx-1" />
                  <button
                    type="button"
                    className={MENU_ITEM_DANGER}
                    onClick={() => {
                      setIsCollectionMenuOpen(false);
                      collectionActions.onDelete();
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-m3-danger shrink-0" />
                    {t("collectionsPage.deleteTitle")}
                  </button>
                </Can>
              </div>
            )}
          </div>
        )}

        {/* View Mode Toggle (hidden on song tables) */}
        {view !== "songs" && view !== "collection-detail" && (
          <div
            role="group"
            aria-label={t("toolbar.viewMode")}
            className="inline-flex items-center bg-m3-bg p-px rounded-md border border-m3-border select-none shrink-0"
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onViewModeChange("grid")}
              title={t("toolbar.gridView")}
              aria-label={t("toolbar.gridView")}
              aria-pressed={viewMode === "grid"}
              className={`min-h-10 min-w-10 ${
                viewMode === "grid"
                  ? "bg-m3-card text-m3-primary shadow-sm"
                  : "text-m3-secondary hover:text-m3-text"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onViewModeChange("list")}
              title={t("toolbar.listView")}
              aria-label={t("toolbar.listView")}
              aria-pressed={viewMode === "list"}
              className={`min-h-10 min-w-10 ${
                viewMode === "list"
                  ? "bg-m3-card text-m3-primary shadow-sm"
                  : "text-m3-secondary hover:text-m3-text"
              }`}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        )}
        {/* Density Selector (Confortável / Compacto) */}
        <div className="flex items-center gap-2 bg-m3-bg border border-m3-border rounded-md px-3 py-1.5 min-h-10 text-xs transition-colors hover:border-m3-primary/30">
          <LayoutGrid className="w-4 h-4 text-m3-primary shrink-0" />
          <select
            value={density}
            onChange={(e) =>
              onDensityChange(e.target.value as "comfortable" | "compact")
            }
            className="bg-transparent font-medium text-m3-text cursor-pointer text-(length:--text-label)"
            title={t("toolbar.density")}
          >
            <option value="comfortable">{t("toolbar.comfortable")}</option>
            <option value="compact">{t("toolbar.compact")}</option>
          </select>
        </div>
      </div>
    </div>
  );
};
