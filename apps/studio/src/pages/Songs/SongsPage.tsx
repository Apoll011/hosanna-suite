/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OverflowTagList } from "@/src/components/OverflowTagList";
import { Badge, EmptyState, Spinner } from "@/src/components/common";
import { MarqueeSelectionBox } from "@/src/components/explorer";
import { useAppNavigate } from "@/src/hooks/useAppNavigate";
import { useMarqueeSelection } from "@/src/hooks/useMarqueeSelection";
import { useI18n } from "@/src/lib/i18n";
import { usePermissionValue } from "@/src/lib/permissions/client";
import { Can } from "@/src/lib/permissions/components";
import { Song } from "@/src/types";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  FolderInput,
  Music,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useFolders } from "../../hooks/useFolders";
import { usePersonalSettings } from "../../hooks/usePersonalSettings";
import { useAllSongs, useSearchableSongs } from "../../hooks/useSongs";
import { filterSearchableSongsWithLiqe } from "../../utils";

interface SongsPageProps {
  searchQuery?: string;
  sortBy?: "title" | "artist" | "updatedAt";
  sortOrder?: "asc" | "desc";
  selectedKey?: string;
  selectedTag?: string;
}

export const SongsPage: React.FC<SongsPageProps> = ({
  searchQuery: externalSearchQuery,
  sortBy: externalSortBy,
  sortOrder: externalSortOrder,
  selectedKey,
  selectedTag,
}) => {
  const { navigate } = useAppNavigate();
  const { t, locale } = useI18n();
  const { settings } = usePersonalSettings();
  const { organization } = useAuth();
  const slugPrefix = organization?.slug ? `/${organization.slug}` : "";
  const context = (useOutletContext<Record<string, unknown>>() || {}) as Record<
    string,
    unknown
  >;

  // Density from context with the unified personal-settings fallback
  const contextDensity = context.density as
    "comfortable" | "compact" | undefined;

  const density = contextDensity ?? settings.explorerDensity;
  const isCompact = density === "compact";

  // Search & Filter props resolution
  const contextSearchQuery = context.searchQuery as string | undefined;
  const contextSortBy = context.sortBy as
    "title" | "artist" | "updatedAt" | "number" | undefined;
  const contextSortOrder = context.sortOrder as "asc" | "desc" | undefined;
  const actualSelectedKey =
    selectedKey ?? (context.selectedKey as string | null) ?? "";
  const actualSelectedTag =
    selectedTag ?? (context.selectedTag as string | null) ?? "";

  const [page, setPage] = useState(1);

  const finalSearchQuery: string =
    externalSearchQuery !== undefined
      ? externalSearchQuery
      : contextSearchQuery !== undefined
        ? contextSearchQuery
        : "";

  const finalSortBy =
    externalSortBy !== undefined
      ? externalSortBy
      : contextSortBy !== undefined
        ? contextSortBy
        : "title";

  const finalSortOrder =
    externalSortOrder !== undefined
      ? externalSortOrder
      : contextSortOrder !== undefined
        ? contextSortOrder
        : "asc";

  const { value: emptyStateAction } = usePermissionValue(
    "song.create",
    t("songsPage.createSong"),
    undefined,
  );

  const [jumpPageInput, setJumpPageInput] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState<number>(50);

  // Modals & Target delegates from layout context
  const openModal = context.openModal as ((modal: string) => void) | undefined;
  const setMoveSongTarget = context.setMoveSongTarget as
    ((song: Song | null) => void) | undefined;
  const setDeleteSongTarget = context.setDeleteSongTarget as
    ((song: Song | null) => void) | undefined;

  const contextSelectedSongIds = context.selectedSongIds as
    Set<string> | undefined;
  const contextSetSelectedSongIds = context.setSelectedSongIds as
    React.Dispatch<React.SetStateAction<Set<string>>> | undefined;

  const [localSelectedSongIds, setLocalSelectedSongIds] = useState<Set<string>>(
    new Set(),
  );
  const selectedSongIds = contextSelectedSongIds ?? localSelectedSongIds;
  const setSelectedSongIds = useCallback<
    React.Dispatch<React.SetStateAction<Set<string>>>
  >(
    (action) => {
      if (contextSetSelectedSongIds) {
        contextSetSelectedSongIds(action);
      } else {
        setLocalSelectedSongIds(action);
      }
    },
    [contextSetSelectedSongIds],
  );

  const [lastClickedId, setLastClickedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    song: Song | null;
    isMulti?: boolean;
  } | null>(null);

  // Fetch full cached song & folder list
  const { songsQuery } = useAllSongs();
  const { foldersQuery } = useFolders();

  const folders = useMemo(
    () =>
      Array.isArray(foldersQuery.data?.folders)
        ? foldersQuery.data.folders
        : [],
    [foldersQuery.data?.folders],
  );

  const { searchableSongs } = useSearchableSongs(folders);
  const allSongs: Song[] = useMemo(
    () => (Array.isArray(songsQuery.data?.songs) ? songsQuery.data.songs : []),
    [songsQuery.data?.songs],
  );

  // Helper: folder map for O(1) lookups
  const folderMap = useMemo(() => {
    const map = new Map<string, string>();
    folders.forEach((f) => map.set(f.id, f.name));
    return map;
  }, [folders]);

  // Client-side filtering & sorting with high performance memoization (Liqe powered)
  const filteredSongs = useMemo(() => {
    let result = allSongs;

    if (finalSearchQuery.trim()) {
      const liqeMatches = filterSearchableSongsWithLiqe(
        searchableSongs,
        finalSearchQuery,
      );
      const matchedIds = new Set(liqeMatches.map((s) => s.id));
      result = result.filter((song) => matchedIds.has(song.id));
    }

    if (actualSelectedKey) {
      result = result.filter((song) => {
        const k = song.content?.match(/\{key:\s*([^}]+)\}/i)?.[1]?.trim();
        return k === actualSelectedKey;
      });
    }

    if (actualSelectedTag) {
      result = result.filter((song) => song.tags?.includes(actualSelectedTag));
    }

    // Client-side sorting
    if (result.length > 1) {
      result = [...result].sort((a, b) => {
        let valA: string | number = "";
        let valB: string | number = "";

        if (finalSortBy === "title") {
          valA = a.title?.toLowerCase() ?? "";
          valB = b.title?.toLowerCase() ?? "";
        } else if (finalSortBy === "artist") {
          valA = a.artist?.toLowerCase() ?? "";
          valB = b.artist?.toLowerCase() ?? "";
        } else if (finalSortBy === "number") {
          valA = a.song_number ?? Infinity;
          valB = b.song_number ?? Infinity;
        } else if (finalSortBy === "updatedAt") {
          valA = new Date(a.updatedAt).getTime();
          valB = new Date(b.updatedAt).getTime();
        }

        if (valA < valB) return finalSortOrder === "asc" ? -1 : 1;
        if (valA > valB) return finalSortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [
    allSongs,
    searchableSongs,
    finalSearchQuery,
    actualSelectedKey,
    actualSelectedTag,
    finalSortBy,
    finalSortOrder,
  ]);

  const totalSongs = filteredSongs.length;
  const effectivePerPage =
    itemsPerPage === 0 ? Math.max(1, totalSongs) : itemsPerPage;
  const totalPages = Math.max(1, Math.ceil(totalSongs / effectivePerPage));

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
    setSelectedSongIds(new Set());
    setLastClickedId(null);
  }, [
    finalSearchQuery,
    finalSortBy,
    finalSortOrder,
    actualSelectedKey,
    actualSelectedTag,
    itemsPerPage,
    setSelectedSongIds,
  ]);

  const songsData = useMemo(() => {
    if (itemsPerPage === 0) return filteredSongs;
    const start = (page - 1) * effectivePerPage;
    return filteredSongs.slice(start, start + effectivePerPage);
  }, [filteredSongs, page, effectivePerPage, itemsPerPage]);

  // Rubberband marquee selection
  const { selectionBox, handleMouseDown: handleWorkspaceMouseDown } =
    useMarqueeSelection({
      containerRef,
      enabled: true,
      selectedIds: selectedSongIds,
      onSelectionChange: setSelectedSongIds,
      onClearSelection: () => {
        setSelectedSongIds(new Set());
        setLastClickedId(null);
      },
    });

  // Keyboard navigation & Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;
      if (isTyping) return;

      if (e.key === "Escape") {
        setContextMenu(null);
        setSelectedSongIds(new Set());
        setLastClickedId(null);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setSelectedSongIds(new Set(songsData.map((s) => s.id)));
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedSongIds.size === 0) return;
        e.preventDefault();
        if (selectedSongIds.size === 1) {
          const songId = Array.from(selectedSongIds)[0];
          const song = allSongs.find((s) => s.id === songId);
          if (song) setDeleteSongTarget?.(song);
        } else {
          openModal?.("batch-delete");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    songsData,
    selectedSongIds,
    allSongs,
    setSelectedSongIds,
    setDeleteSongTarget,
    openModal,
  ]);

  // Outside click to close context menu
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const handleJumpPage = (e: React.FormEvent) => {
    e.preventDefault();
    const targetPage = parseInt(jumpPageInput, 10);
    if (!isNaN(targetPage) && targetPage >= 1 && targetPage <= totalPages) {
      setPage(targetPage);
      setJumpPageInput("");
    }
  };

  const handleSongClick = useCallback(
    (e: React.MouseEvent, song: Song) => {
      e.stopPropagation();

      if (e.ctrlKey || e.metaKey) {
        setSelectedSongIds((prev) => {
          const next = new Set(prev);
          if (next.has(song.id)) next.delete(song.id);
          else next.add(song.id);
          return next;
        });
        setLastClickedId(song.id);
      } else if (e.shiftKey && lastClickedId) {
        const allIds = songsData.map((s) => s.id);
        const idx1 = allIds.indexOf(lastClickedId);
        const idx2 = allIds.indexOf(song.id);
        if (idx1 !== -1 && idx2 !== -1) {
          const start = Math.min(idx1, idx2);
          const end = Math.max(idx1, idx2);
          const rangeIds = allIds.slice(start, end + 1);
          setSelectedSongIds(new Set(rangeIds));
        } else {
          setSelectedSongIds(new Set([song.id]));
        }
        setLastClickedId(song.id);
      } else {
        if (selectedSongIds.size === 1 && selectedSongIds.has(song.id)) {
          navigate(`${slugPrefix}/songs/${song.id}`);
          return;
        }
        setSelectedSongIds(new Set([song.id]));
        setLastClickedId(song.id);
      }
    },
    [
      navigate,
      slugPrefix,
      lastClickedId,
      selectedSongIds,
      songsData,
      setSelectedSongIds,
    ],
  );

  const openContextMenu = useCallback(
    (e: React.MouseEvent, song: Song) => {
      e.preventDefault();
      e.stopPropagation();
      const x = Math.min(e.clientX, window.innerWidth - 240);
      const y = Math.min(e.clientY, window.innerHeight - 320);
      const isMulti = selectedSongIds.size > 1 && selectedSongIds.has(song.id);
      setContextMenu({ x, y, song, isMulti });
    },
    [selectedSongIds],
  );

  return (
    <div
      ref={containerRef}
      data-tour="songs-list"
      onMouseDown={handleWorkspaceMouseDown}
      className="flex-1 flex flex-col w-full mx-auto space-y-4 animate-in fade-in duration-300 overflow-y-auto h-full relative select-none p-4 sm:p-8 max-w-7xl"
    >
      {/* Main Content Area: Grid / Table View */}
      <div className="bg-m3-card border border-m3-border rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] overflow-hidden flex flex-col flex-1 transition-colors">
        {songsQuery.isLoading ? (
          <div className="flex-1 flex items-center justify-center p-12 min-h-64">
            <Spinner label={t("songsPage.loading")} />
          </div>
        ) : songsQuery.isError ? (
          <div className="p-12 text-center text-m3-danger font-bold">
            {t("songsPage.loadError", {
              error: (songsQuery.error as unknown as Error).message,
            })}
          </div>
        ) : songsData.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<Music className="w-12 h-12 text-m3-primary opacity-40" />}
              title={t("songsPage.noResults")}
              description={
                finalSearchQuery
                  ? t("songsPage.noResultsDesc")
                  : t("songsPage.emptyDesc")
              }
              actionLabel={emptyStateAction}
              onAction={() => openModal?.("create-song")}
            />
          </div>
        ) : (
          /* Table View Layout */
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse select-none">
              <thead>
                <tr className="bg-m3-sidebar/40 border-b border-m3-border text-label">
                  <th className={isCompact ? "py-2.5 px-4" : "py-3 px-5"}>
                    {t("songsPage.titlePath")}
                  </th>
                  <th
                    className={`hidden sm:table-cell ${isCompact ? "py-2.5 px-4" : "py-3 px-5"}`}
                  >
                    {t("songsPage.artist")}
                  </th>
                  <th
                    className={`hidden lg:table-cell ${isCompact ? "py-2.5 px-4" : "py-3 px-5"}`}
                  >
                    {t("songsPage.folder")}
                  </th>
                  <th
                    className={`hidden lg:table-cell ${isCompact ? "py-2.5 px-4" : "py-3 px-5"}`}
                  >
                    {t("songsPage.tags")}
                  </th>
                  <th
                    className={`hidden md:table-cell ${isCompact ? "py-2.5 px-4" : "py-3 px-5"}`}
                  >
                    {t("songsPage.updatedAt")}
                  </th>
                  <th
                    className={`${isCompact ? "py-2.5 px-4" : "py-3 px-5"} text-right`}
                  >
                    <span className="sr-only">{t("songsPage.actions")}</span>
                  </th>
                </tr>
              </thead>
              <tbody
                className={`divide-y divide-m3-border/40 ${
                  isCompact ? "text-xs" : "text-[13px]"
                } font-medium`}
              >
                {songsData.map((song) => {
                  const folderName = folderMap.get(song.folderId || "");
                  const isSelected = selectedSongIds.has(song.id);

                  return (
                    <tr
                      key={song.id}
                      data-item-id={song.id}
                      data-item-type="song"
                      className={`transition-colors group cursor-pointer ${
                        isSelected
                          ? "bg-m3-primary/10 text-m3-primary"
                          : "hover:bg-m3-hover/50 text-m3-text"
                      }`}
                      onClick={(e) => handleSongClick(e, song)}
                      onDoubleClick={() =>
                        navigate(`${slugPrefix}/songs/${song.id}`)
                      }
                      onContextMenu={(e) => openContextMenu(e, song)}
                    >
                      <td
                        className={`${isCompact ? "py-2.5 px-4" : "py-3 px-5"} max-w-xs sm:max-w-md`}
                      >
                        <div className="flex flex-col min-w-0">
                          <span className="truncate font-semibold text-m3-text">
                            {song.title}
                          </span>
                          <span className="sm:hidden text-caption truncate mt-0.5">
                            {song.artist || "—"}
                          </span>
                          {song.path && (
                            <span className="hidden sm:block text-label opacity-60 mt-0.5 truncate">
                              {song.path.split("/")[0]}/
                            </span>
                          )}
                        </div>
                      </td>

                      <td
                        className={`hidden sm:table-cell ${isCompact ? "py-2.5 px-4" : "py-3 px-5"} text-m3-secondary max-w-40 truncate font-normal`}
                      >
                        {song.artist || "—"}
                      </td>

                      <td
                        className={`hidden lg:table-cell ${isCompact ? "py-2.5 px-4" : "py-3 px-5"}`}
                      >
                        {folderName ? (
                          <Badge variant="sky">{folderName}</Badge>
                        ) : (
                          <span className="text-label opacity-40 italic">
                            {t("songsPage.root")}
                          </span>
                        )}
                      </td>

                      <td
                        className={`hidden lg:table-cell ${isCompact ? "py-2.5 px-4" : "py-3 px-5"} max-w-56`}
                      >
                        <OverflowTagList tags={song.tags} />
                      </td>

                      <td
                        className={`hidden md:table-cell tabular-nums ${isCompact ? "py-2.5 px-4" : "py-3 px-5"} text-caption whitespace-nowrap`}
                      >
                        {new Date(song.updatedAt).toLocaleDateString(locale)}
                      </td>

                      <td
                        className={`${isCompact ? "py-2.5 px-3" : "py-3 px-4"} text-right`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-0.5">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`${slugPrefix}/songs/${song.id}`)
                            }
                            title={t("songsPage.openEditor")}
                            aria-label={t("songsPage.openEditor")}
                            className="min-h-10 min-w-10 inline-flex items-center justify-center text-m3-secondary hover:text-m3-primary hover:bg-m3-primary/10 rounded-[var(--radius-md)] cursor-pointer transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <Can permission="song.update">
                            <button
                              type="button"
                              onClick={() => setMoveSongTarget?.(song)}
                              title={t("songsPage.move")}
                              aria-label={t("songsPage.move")}
                              className="hidden md:inline-flex min-h-10 min-w-10 items-center justify-center text-m3-secondary hover:text-m3-primary hover:bg-m3-primary/10 rounded-[var(--radius-md)] cursor-pointer transition-colors"
                            >
                              <FolderInput className="w-4 h-4" />
                            </button>
                          </Can>
                          <Can permission="song.delete">
                            <button
                              type="button"
                              onClick={() => setDeleteSongTarget?.(song)}
                              title={t("songsPage.delete")}
                              aria-label={t("songsPage.delete")}
                              className="hidden md:inline-flex min-h-10 min-w-10 items-center justify-center text-m3-secondary hover:text-m3-danger hover:bg-m3-danger/10 rounded-[var(--radius-md)] cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </Can>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Clean, Modern Pagination & Status Footer Bar */}
        <div className="px-4 py-3 bg-m3-sidebar/30 border-t border-m3-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          {/* Left: Summary & Per-Page selector */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <span className="text-m3-secondary font-medium">
              {totalSongs === 0 ? (
                t("songsPage.zeroSongs")
              ) : (
                <>
                  {t("songsPage.showing")}{" "}
                  <strong className="font-bold text-m3-text">
                    {itemsPerPage === 0 ? 1 : (page - 1) * effectivePerPage + 1}
                  </strong>{" "}
                  {t("songsPage.to")}{" "}
                  <strong className="font-bold text-m3-text">
                    {itemsPerPage === 0
                      ? totalSongs
                      : Math.min(page * effectivePerPage, totalSongs)}
                  </strong>{" "}
                  {t("songsPage.of")}{" "}
                  <strong className="font-bold text-m3-text">
                    {totalSongs}
                  </strong>{" "}
                  {t("songsPage.songsWord")}
                </>
              )}
            </span>

            <div className="flex items-center gap-1.5 bg-m3-card border border-m3-border rounded-xl px-2.5 py-1 shadow-[var(--shadow-sm)]">
              <span className="text-label">{t("songsPage.display")}</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-transparent font-bold text-m3-text focus:outline-none cursor-pointer text-xs"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={0}>
                  {t("songsPage.allPages", { count: totalSongs })}
                </option>
              </select>
            </div>
          </div>

          {/* Right: Clean Page Controls */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              {/* Navigation button group */}
              <div className="flex items-center gap-1 bg-m3-card border border-m3-border rounded-xl p-1 shadow-[var(--shadow-sm)]">
                <button
                  type="button"
                  onClick={() => setPage(1)}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg text-m3-secondary hover:text-m3-text hover:bg-m3-hover disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title={t("songsPage.firstPage")}
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg text-m3-secondary hover:text-m3-text hover:bg-m3-hover disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title={t("songsPage.prevPage")}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <span className="px-2 font-bold text-m3-text flex items-center text-xs whitespace-nowrap">
                  <form onSubmit={handleJumpPage} className="flex items-center">
                    <input
                      type="number"
                      min={1}
                      max={totalPages}
                      placeholder={String(page)}
                      value={jumpPageInput}
                      onChange={(e) => setJumpPageInput(e.target.value)}
                      className="w-5 bg-transparent text-center font-bold text-m3-text focus:outline-none border-b border-m3-border focus:border-m3-primary text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </form>{" "}
                  / {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-lg text-m3-secondary hover:text-m3-text hover:bg-m3-hover disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title={t("songsPage.nextPage")}
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPage(totalPages)}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-lg text-m3-secondary hover:text-m3-text hover:bg-m3-hover disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title={t("songsPage.lastPage")}
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Context Menu */}
      {contextMenu && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 w-56 bg-m3-card border border-m3-border rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] p-1.5 flex flex-col gap-0.5 text-xs select-none hosanna-enter"
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.isMulti ? (
            <>
              <div className="px-3 py-1.5 text-label text-m3-secondary border-b border-m3-border/60 mb-0.5 truncate flex items-center justify-between">
                <span>{t("songsPage.multiSelect")}</span>
                <Badge variant="sky">{selectedSongIds.size}</Badge>
              </div>

              <Can permission="song.update">
                <button
                  type="button"
                  onClick={() => {
                    openModal?.("batch-tag");
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-m3-text hover:bg-m3-hover font-medium transition-colors text-left cursor-pointer"
                >
                  <Tag className="w-4 h-4 text-m3-secondary" />
                  <span>
                    {t("songsPage.tagCount", { count: selectedSongIds.size })}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    openModal?.("batch-move");
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-m3-text hover:bg-m3-hover font-medium transition-colors text-left cursor-pointer"
                >
                  <FolderInput className="w-4 h-4 text-m3-secondary" />
                  <span>
                    {t("songsPage.moveCount", { count: selectedSongIds.size })}
                  </span>
                </button>
              </Can>

              <Can permission="song.delete">
                <button
                  type="button"
                  onClick={() => {
                    openModal?.("batch-delete");
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-m3-danger hover:bg-m3-danger/10 font-semibold transition-colors text-left cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-m3-danger" />
                  <span>
                    {t("songsPage.deleteCount", {
                      count: selectedSongIds.size,
                    })}
                  </span>
                </button>
              </Can>

              <div className="my-1 border-t border-m3-border/60" />

              <button
                type="button"
                onClick={() => {
                  setSelectedSongIds(new Set());
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-m3-secondary hover:bg-m3-hover font-medium transition-colors text-left cursor-pointer"
              >
                <X className="w-4 h-4 text-m3-secondary" />
                <span>{t("songsPage.deselect")}</span>
              </button>
            </>
          ) : contextMenu.song ? (
            <>
              <div className="px-3 py-1.5 text-label text-m3-secondary border-b border-m3-border/60 mb-0.5 truncate">
                {contextMenu.song.title}
              </div>

              <button
                type="button"
                onClick={() => {
                  navigate(`${slugPrefix}/songs/${contextMenu.song!.id}`);
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-m3-text hover:bg-m3-hover font-medium transition-colors text-left cursor-pointer"
              >
                <FileText className="w-4 h-4 text-m3-secondary" />
                <span>{t("songsPage.openInEditor")}</span>
              </button>

              <Can permission="song.update">
                <button
                  type="button"
                  onClick={() => {
                    setMoveSongTarget?.(contextMenu.song);
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-m3-text hover:bg-m3-hover font-medium transition-colors text-left cursor-pointer"
                >
                  <FolderInput className="w-4 h-4 text-m3-secondary" />
                  <span>{t("songsPage.moveSong")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedSongIds(new Set([contextMenu.song!.id]));
                    openModal?.("batch-tag");
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-m3-text hover:bg-m3-hover font-medium transition-colors text-left cursor-pointer"
                >
                  <Tag className="w-4 h-4 text-m3-secondary" />
                  <span>{t("songsPage.tagSong")}</span>
                </button>
              </Can>

              <Can permission="song.delete">
                <div className="my-1 border-t border-m3-border/60" />
                <button
                  type="button"
                  onClick={() => {
                    setDeleteSongTarget?.(contextMenu.song);
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-m3-danger hover:bg-m3-danger/10 font-semibold transition-colors text-left cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-m3-danger" />
                  <span>{t("songsPage.deleteSong")}</span>
                </button>
              </Can>
            </>
          ) : null}
        </div>
      )}

      {/* Marquee Selection Box */}
      <MarqueeSelectionBox box={selectionBox} />
    </div>
  );
};
