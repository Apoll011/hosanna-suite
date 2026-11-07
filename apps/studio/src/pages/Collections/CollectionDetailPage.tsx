/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Button,
  ConfirmDialog,
  EmptyState,
  Spinner,
} from "@/src/components/common";
import { BatchActionFloatingBar } from "@/src/components/explorer/BatchActionFloatingBar";
import { MarqueeSelectionBox } from "@/src/components/explorer/MarqueeSelectionBox";
import { AddSongsToCollectionModal } from "@/src/components/modals/AddSongsToCollectionModal";
import { CreateCollectionModal } from "@/src/components/modals/CreateCollectionModal";
import { useAuth } from "@/src/contexts/AuthContext";
import { useAppNavigate } from "@/src/hooks/useAppNavigate";
import { useCollection, useCollections } from "@/src/hooks/useCollections";
import { useMarqueeSelection } from "@/src/hooks/useMarqueeSelection";
import { useAllSongs } from "@/src/hooks/useSongs";
import { useI18n } from "@/src/lib/i18n";
import { useCan } from "@/src/lib/permissions/client";
import { Can } from "@/src/lib/permissions/components";
import { Song } from "@/src/types";
import {
  getFolderColorStyle,
  getFolderIconComponent,
} from "@/src/utils/folderCustomization";
import {
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Edit2,
  ExternalLink,
  FolderKanban,
  MoreHorizontal,
  Music2,
  Plus,
  Printer,
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
import { useOutletContext, useParams } from "react-router-dom";

const MENU_ITEM =
  "w-full flex items-center gap-2.5 px-3 py-2 min-h-10 rounded-[var(--radius-md)] text-m3-text hover:bg-m3-hover font-medium transition-colors text-left cursor-pointer";
const MENU_ITEM_DANGER =
  "w-full flex items-center gap-2.5 px-3 py-2 min-h-10 rounded-[var(--radius-md)] text-m3-danger hover:bg-m3-danger/10 font-semibold transition-colors text-left cursor-pointer";
const MENU_ICON = "w-4 h-4 text-m3-secondary shrink-0";

export const CollectionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { navigate } = useAppNavigate();
  const { t } = useI18n();
  const { organization } = useAuth();
  const slugPrefix = organization?.slug ? `/${organization.slug}` : "";

  const { data: collection, isLoading: isCollectionLoading } = useCollection(
    id || null,
  );

  const { searchQuery } = useOutletContext<{
    searchQuery: string;
  }>();

  const {
    updateCollection,
    deleteCollection,
    addSongsToCollection,
    removeSongsFromCollection,
    printCollection,
  } = useCollections();

  const { granted: canUpdateCollection } = useCan("collection.update");

  const { songsQuery } = useAllSongs();
  const allSongs = useMemo(
    () => (Array.isArray(songsQuery.data?.songs) ? songsQuery.data.songs : []),
    [songsQuery.data?.songs],
  );

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Modals & menus
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddSongsModalOpen, setIsAddSongsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [songToRemove, setSongToRemove] = useState<Song | null>(null);
  const [pendingRemoveIds, setPendingRemoveIds] = useState<string[]>([]);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [selectedSongIds, setSelectedSongIds] = useState<Set<string>>(
    new Set(),
  );
  const [lastClickedId, setLastClickedId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    songId: string | null;
  } | null>(null);
  const headerMenuRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { selectionBox, handleMouseDown } = useMarqueeSelection({
    containerRef,
    selectedIds: selectedSongIds,
    onSelectionChange: setSelectedSongIds,
    onClearSelection: () => {
      setSelectedSongIds(new Set());
      setLastClickedId(null);
    },
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        headerMenuRef.current &&
        !headerMenuRef.current.contains(e.target as Node)
      ) {
        setIsHeaderMenuOpen(false);
      }
      const target = e.target as HTMLElement | null;
      if (!target?.closest?.("[data-collection-context-menu]")) {
        setContextMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedSongIds(new Set());
    setLastClickedId(null);
  }, [searchQuery]);

  // Songs in this collection (union of both sides of the relationship)
  const songsInCollection = useMemo(() => {
    if (!collection) return [];
    const songIdSet = new Set(collection.songIds || []);
    return allSongs.filter(
      (song) =>
        songIdSet.has(song.id) ||
        (Array.isArray(song.collectionIds) &&
          song.collectionIds.includes(collection.id)),
    );
  }, [collection, allSongs]);

  // Apply both global and local search filters
  const filteredSongs = useMemo(() => {
    let result = songsInCollection;
    const gq = searchQuery.trim().toLowerCase();
    if (gq) {
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(gq) ||
          s.artist.toLowerCase().includes(gq) ||
          s.tags?.some((tag) => tag.toLowerCase().includes(gq)),
      );
    }
    return result;
  }, [songsInCollection, searchQuery]);

  // Pagination
  const totalSongs = filteredSongs.length;
  const totalPages = Math.ceil(totalSongs / itemsPerPage) || 1;
  const paginatedSongs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSongs.slice(start, start + itemsPerPage);
  }, [filteredSongs, currentPage]);

  const handleUpdate = async (data: {
    name: string;
    description?: string | null;
    color?: string;
    icon?: string;
    image?: string | null;
  }) => {
    if (!collection) return;
    await updateCollection({ id: collection.id, ...data });
    setIsEditModalOpen(false);
  };

  const handleDelete = async () => {
    if (!collection) return;
    await deleteCollection(collection.id);
    navigate(`${slugPrefix}/collections`);
  };

  const handleAddSongs = async (songIds: string[]) => {
    if (!collection) return;
    await addSongsToCollection(collection.id, songIds);
  };

  const handleRemoveSong = async () => {
    if (!collection || !songToRemove) return;
    await removeSongsFromCollection(collection.id, [songToRemove.id]);
    setSelectedSongIds((prev) => {
      const next = new Set(prev);
      next.delete(songToRemove.id);
      return next;
    });
    setSongToRemove(null);
  };

  const handleBatchRemove = async () => {
    if (!collection || pendingRemoveIds.length === 0) return;
    const ids = [...pendingRemoveIds];
    setPendingRemoveIds([]);
    await removeSongsFromCollection(collection.id, ids);
    setSelectedSongIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
    setContextMenu(null);
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
        return;
      }
      if (e.shiftKey && lastClickedId) {
        const ids = filteredSongs.map((s) => s.id);
        const a = ids.indexOf(lastClickedId);
        const b = ids.indexOf(song.id);
        if (a !== -1 && b !== -1) {
          setSelectedSongIds(
            new Set(ids.slice(Math.min(a, b), Math.max(a, b) + 1)),
          );
        } else {
          setSelectedSongIds(new Set([song.id]));
        }
        setLastClickedId(song.id);
        return;
      }
      setSelectedSongIds(new Set([song.id]));
      setLastClickedId(song.id);
    },
    [filteredSongs, lastClickedId],
  );

  const openContextMenu = useCallback((e: React.MouseEvent, song?: Song) => {
    e.preventDefault();
    e.stopPropagation();
    if (song) {
      setSelectedSongIds((prev) =>
        prev.has(song.id) && prev.size > 1 ? prev : new Set([song.id]),
      );
      setLastClickedId(song.id);
    }
    const x = Math.min(e.clientX, window.innerWidth - 240);
    const y = Math.min(e.clientY, window.innerHeight - 240);
    setContextMenu({ x, y, songId: song?.id ?? null });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setContextMenu(null);
        setSelectedSongIds(new Set());
        setLastClickedId(null);
        return;
      }
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;
      if (isTyping) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setSelectedSongIds(new Set(filteredSongs.map((s) => s.id)));
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedSongIds.size === 0 || !canUpdateCollection) return;
        e.preventDefault();
        if (selectedSongIds.size === 1) {
          const song = filteredSongs.find((s) => selectedSongIds.has(s.id));
          if (song) setSongToRemove(song);
        } else {
          setPendingRemoveIds(Array.from(selectedSongIds));
        }
        return;
      }
      if (e.key === "Enter" && selectedSongIds.size === 1) {
        navigate(`${slugPrefix}/songs/${Array.from(selectedSongIds)[0]}`);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    filteredSongs,
    selectedSongIds,
    canUpdateCollection,
    navigate,
    slugPrefix,
  ]);

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (isCollectionLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Spinner size="lg" label={t("common.loading")} />
      </div>
    );
  }

  // ── Not found ───────────────────────────────────────────────────────────────
  if (!collection) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <EmptyState
          icon={<FolderKanban className="w-8 h-8" />}
          title={t("collectionsPage.notFoundTitle")}
          description={t("collectionsPage.notFoundDesc")}
          actionLabel={t("collectionsPage.backToCollections")}
          onAction={() => navigate(`${slugPrefix}/collections`)}
        />
      </div>
    );
  }

  const IconComp = getFolderIconComponent(collection.icon);
  const colorStyle = getFolderColorStyle(collection.color);
  const songCount = songsInCollection.length;
  const isFiltering = searchQuery.trim() !== "";

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      className="flex-1 flex flex-col h-full overflow-y-auto bg-m3-bg select-none"
    >
      {/* Identity strip */}
      <div className="relative w-full overflow-hidden border-b border-m3-border">
        {collection.image ? (
          <img
            src={collection.image}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
        ) : (
          <div
            className="absolute inset-0 opacity-40"
            style={{
              background: `linear-gradient(90deg, ${colorStyle.colorHex}22 0%, ${colorStyle.colorHex}55 100%)`,
            }}
          />
        )}
        <div className="absolute inset-0 bg-m3-card/80 backdrop-blur-sm" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4">
          <div
            className="w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center text-white shrink-0 border border-white/20"
            style={{ backgroundColor: colorStyle.colorHex }}
          >
            <IconComp className="w-6 h-6" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <h1 className="text-display text-m3-text truncate">
              {collection.name}
            </h1>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-caption">
                {t(
                  `collectionsPage.songCount.${songCount === 1 ? "one" : "other"}`,
                  { count: songCount },
                )}
              </span>
              {collection.description && (
                <>
                  <span className="text-m3-border">·</span>
                  <span className="text-caption line-clamp-1">
                    {collection.description}
                  </span>
                </>
              )}
            </div>
          </div>

          <div ref={headerMenuRef} className="flex items-center gap-2 shrink-0">
            <Can permission="export.pdf">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={<Printer className="w-3.5 h-3.5" />}
                onClick={() =>
                  void printCollection(collection, songsInCollection)
                }
                title={t("print.buttons.printCollection")}
              >
                <span className="hidden sm:inline">{t("common.print")}</span>
              </Button>
            </Can>
            <Can permission="collection.update">
              <Button
                type="button"
                variant="primary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setIsAddSongsModalOpen(true)}
              >
                {t("collectionsPage.addSongs")}
              </Button>
            </Can>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsHeaderMenuOpen((v) => !v)}
                className="p-2 min-h-10 min-w-10 inline-flex items-center justify-center rounded-[var(--radius-md)] border border-m3-border bg-m3-card text-m3-secondary hover:text-m3-text hover:bg-m3-hover transition-colors cursor-pointer"
                title={t("explorer.moreOptions")}
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {isHeaderMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-m3-card border border-m3-border rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] z-30 p-1.5 space-y-0.5 hosanna-enter">
                  <Can permission="export.pdf">
                    <button
                      type="button"
                      onClick={() => {
                        setIsHeaderMenuOpen(false);
                        void printCollection(collection, songsInCollection);
                      }}
                      className={MENU_ITEM}
                    >
                      <Printer className={MENU_ICON} />
                      {t("print.buttons.printCollection")}
                    </button>
                  </Can>
                  <Can permission="collection.update">
                    <button
                      type="button"
                      onClick={() => {
                        setIsHeaderMenuOpen(false);
                        setIsEditModalOpen(true);
                      }}
                      className={MENU_ITEM}
                    >
                      <Edit2 className={MENU_ICON} />
                      {t("collectionsPage.editCollection")}
                    </button>
                  </Can>
                  <Can permission="collection.update">
                    <button
                      type="button"
                      onClick={() => {
                        setIsHeaderMenuOpen(false);
                        setIsAddSongsModalOpen(true);
                      }}
                      className={MENU_ITEM}
                    >
                      <Plus className={MENU_ICON} />
                      {t("collectionsPage.addSongs")}
                    </button>
                  </Can>
                  <Can permission="collection.delete">
                    <div className="my-1 h-px bg-m3-border mx-1" />
                    <button
                      type="button"
                      onClick={() => {
                        setIsHeaderMenuOpen(false);
                        setIsDeleteDialogOpen(true);
                      }}
                      className={MENU_ITEM_DANGER}
                    >
                      <Trash2 className="w-4 h-4 text-m3-danger shrink-0" />
                      {t("collectionsPage.deleteTitle")}
                    </button>
                  </Can>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 sm:px-6 py-4">
        {paginatedSongs.length === 0 ? (
          <EmptyState
            icon={<Music2 className="w-8 h-8" />}
            title={
              songsInCollection.length === 0
                ? t("collectionsPage.emptyTitle")
                : t("collectionsPage.noSearchResultsTitle")
            }
            description={
              songsInCollection.length === 0
                ? t("collectionsPage.emptyDesc")
                : t("collectionsPage.noSearchResultsDesc", {
                    query: searchQuery,
                  })
            }
            actionLabel={
              !isFiltering && canUpdateCollection
                ? t("collectionsPage.addSongs")
                : undefined
            }
            onAction={
              !isFiltering && canUpdateCollection
                ? () => setIsAddSongsModalOpen(true)
                : undefined
            }
          />
        ) : (
          /* Song table */
          <div className="bg-m3-card border border-m3-border rounded-[var(--radius-xl)] shadow-sm overflow-hidden flex flex-col transition-all">
            {/* Column headers */}
            <div className="grid grid-cols-[2rem_1fr_auto] sm:grid-cols-[2rem_1fr_auto_6.5rem] gap-3 items-center px-6 py-3.5 border-b border-m3-border bg-m3-sidebar/40">
              <span className="text-label text-center">#</span>
              <span className="text-label">{t("songsPage.titlePath")}</span>
              <span className="hidden sm:block text-label text-right">
                {t("songsPage.tags")}
              </span>
              <span className="text-label text-right">
                {t("songsPage.actions")}
              </span>
            </div>

            <div className="divide-y divide-m3-border/30 text-sm font-semibold">
              {paginatedSongs.map((song, index) => {
                const globalIndex =
                  (currentPage - 1) * itemsPerPage + index + 1;
                const keyMatch = song.content
                  ?.match(/\{key:\s*([^}]+)\}/i)?.[1]
                  ?.trim();
                const isSelected = selectedSongIds.has(song.id);

                return (
                  <div
                    key={song.id}
                    data-item-id={song.id}
                    onClick={(e) => handleSongClick(e, song)}
                    onDoubleClick={() =>
                      navigate(`${slugPrefix}/songs/${song.id}`)
                    }
                    onContextMenu={(e) => openContextMenu(e, song)}
                    className={`grid grid-cols-[2rem_1fr_auto] sm:grid-cols-[2rem_1fr_auto_6.5rem] gap-3 items-center px-6 py-3.5 transition-colors select-none cursor-pointer ${
                      isSelected
                        ? "bg-m3-primary/5 ring-2 ring-inset ring-m3-primary/30 text-m3-primary"
                        : "text-m3-text hover:bg-m3-hover/50"
                    }`}
                  >
                    <span className="text-center text-caption tabular-nums">
                      {globalIndex}
                    </span>

                    <div className="flex flex-col min-w-0">
                      <span className="truncate font-semibold">
                        {song.title}
                      </span>
                      <span className="text-caption mt-0.5 truncate">
                        {song.artist || "—"}
                      </span>
                    </div>

                    <div className="hidden sm:flex items-center gap-1.5 flex-wrap justify-end">
                      {keyMatch && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40">
                          {keyMatch}
                        </span>
                      )}
                      {song.tags?.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-m3-sidebar text-m3-secondary border border-m3-border"
                        >
                          {tag}
                        </span>
                      ))}
                      {(song.tags?.length ?? 0) > 2 && (
                        <span className="text-caption">
                          +{(song.tags?.length ?? 0) - 2}
                        </span>
                      )}
                    </div>

                    <div
                      className="flex items-center justify-end gap-1"
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`${slugPrefix}/songs/${song.id}`)
                        }
                        className="p-1.5 text-m3-secondary hover:text-m3-text hover:bg-m3-hover rounded-[var(--radius-md)] cursor-pointer transition-colors"
                        title={t("collectionsPage.viewSong")}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                      <Can permission="collection.update">
                        <button
                          type="button"
                          onClick={() => setSongToRemove(song)}
                          className="p-1.5 text-m3-secondary hover:text-m3-danger hover:bg-m3-danger/10 rounded-[var(--radius-md)] cursor-pointer transition-colors"
                          title={t("collectionsPage.removeFromCollection")}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </Can>
                      <button
                        type="button"
                        onClick={(e) => openContextMenu(e, song)}
                        className="p-1.5 rounded-[var(--radius-md)] text-m3-secondary hover:text-m3-text hover:bg-m3-hover transition-colors cursor-pointer"
                        title={t("explorer.moreOptions")}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination footer */}
            {totalPages > 1 && (
              <div className="px-4 py-3 bg-m3-sidebar/30 border-t border-m3-border flex items-center justify-between text-xs">
                <span className="text-m3-secondary font-medium">
                  {t("collectionsPage.paginationInfo", {
                    from: Math.min(
                      (currentPage - 1) * itemsPerPage + 1,
                      totalSongs,
                    ),
                    to: Math.min(currentPage * itemsPerPage, totalSongs),
                    total: totalSongs,
                  })}
                </span>
                <div className="flex items-center gap-1 bg-m3-card border border-m3-border rounded-xl p-1 shadow-xs">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="p-1.5 rounded-lg text-m3-secondary hover:text-m3-text hover:bg-m3-hover disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => {
                      if (totalPages <= 7) return true;
                      if (p === 1 || p === totalPages) return true;
                      return Math.abs(p - currentPage) <= 1;
                    })
                    .map((p, idx, arr) => {
                      const prev = arr[idx - 1];
                      const showEllipsis = prev && p - prev > 1;
                      return (
                        <React.Fragment key={p}>
                          {showEllipsis && (
                            <span className="px-1 text-m3-secondary opacity-50">
                              …
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => setCurrentPage(p)}
                            className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                              currentPage === p
                                ? "bg-m3-primary text-white shadow-sm"
                                : "hover:bg-m3-hover text-m3-text"
                            }`}
                          >
                            {p}
                          </button>
                        </React.Fragment>
                      );
                    })}

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage >= totalPages}
                    className="p-1.5 rounded-lg text-m3-secondary hover:text-m3-text hover:bg-m3-hover disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MODALS ───────────────────────────────────────────────────────────── */}
      <CreateCollectionModal
        isOpen={isEditModalOpen}
        collection={collection}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleUpdate}
      />

      <AddSongsToCollectionModal
        isOpen={isAddSongsModalOpen}
        collection={collection}
        allSongs={allSongs}
        onClose={() => setIsAddSongsModalOpen(false)}
        onAddSongs={handleAddSongs}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title={t("collectionsPage.deleteTitle")}
        message={t("collectionsPage.deletePermanentMessage", {
          name: collection.name,
        })}
        confirmText={t("collectionsPage.delete")}
        cancelText={t("common.cancel")}
        variant="danger"
      />

      <ConfirmDialog
        isOpen={Boolean(songToRemove)}
        onClose={() => setSongToRemove(null)}
        onConfirm={handleRemoveSong}
        title={t("collectionsPage.removeSongTitle")}
        message={t("collectionsPage.removeSongMessage", {
          title: songToRemove?.title ?? "",
        })}
        confirmText={t("collectionsPage.removeFromCollection")}
        cancelText={t("common.cancel")}
        variant="danger"
      />

      <ConfirmDialog
        isOpen={pendingRemoveIds.length > 0}
        onClose={() => setPendingRemoveIds([])}
        onConfirm={handleBatchRemove}
        title={t("collectionsPage.removeSongTitle")}
        message={t("songsPage.deleteCount", {
          count: pendingRemoveIds.length,
        })}
        confirmText={t("collectionsPage.removeFromCollection")}
        cancelText={t("common.cancel")}
        variant="danger"
      />

      <BatchActionFloatingBar
        selectedCount={selectedSongIds.size}
        itemLabel={t("songsPage.songsWord")}
        onDelete={() => {
          if (!canUpdateCollection) return;
          setPendingRemoveIds(Array.from(selectedSongIds));
        }}
        onCancel={() => {
          setSelectedSongIds(new Set());
          setLastClickedId(null);
        }}
        deleteLabel={t("collectionsPage.removeFromCollection")}
      />

      <MarqueeSelectionBox box={selectionBox} />

      {contextMenu && (
        <div
          data-collection-context-menu
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 w-56 bg-m3-card border border-m3-border rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] p-1.5 flex flex-col gap-0.5 text-xs select-none hosanna-enter"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          {selectedSongIds.size > 1 &&
          contextMenu.songId &&
          selectedSongIds.has(contextMenu.songId) ? (
            <>
              <div className="px-3 py-1.5 text-label border-b border-m3-border mb-0.5 flex items-center justify-between">
                <span>{t("songsPage.multiSelect")}</span>
                <span className="text-caption">{selectedSongIds.size}</span>
              </div>
              <button
                type="button"
                className={MENU_ITEM}
                onClick={() => {
                  setSelectedSongIds(new Set(filteredSongs.map((s) => s.id)));
                  setContextMenu(null);
                }}
              >
                <CheckSquare className={MENU_ICON} />
                <span>{t("explorer.contextMenu.selectAll")}</span>
              </button>
              <Can permission="collection.update">
                <button
                  type="button"
                  className={MENU_ITEM_DANGER}
                  onClick={() => {
                    setPendingRemoveIds(Array.from(selectedSongIds));
                    setContextMenu(null);
                  }}
                >
                  <Trash2 className="w-4 h-4 text-m3-danger shrink-0" />
                  <span>{t("collectionsPage.removeFromCollection")}</span>
                </button>
              </Can>
              <div className="my-1 border-t border-m3-border" />
              <button
                type="button"
                className={MENU_ITEM}
                onClick={() => {
                  setSelectedSongIds(new Set());
                  setLastClickedId(null);
                  setContextMenu(null);
                }}
              >
                <X className={MENU_ICON} />
                <span>{t("songsPage.deselect")}</span>
              </button>
            </>
          ) : contextMenu.songId ? (
            <>
              <div className="px-3 py-1.5 text-label border-b border-m3-border mb-0.5 truncate">
                {filteredSongs.find((s) => s.id === contextMenu.songId)
                  ?.title ?? ""}
              </div>
              <button
                type="button"
                className={MENU_ITEM}
                onClick={() => {
                  navigate(`${slugPrefix}/songs/${contextMenu.songId}`);
                  setContextMenu(null);
                }}
              >
                <Music2 className={MENU_ICON} />
                <span>{t("collectionsPage.viewSong")}</span>
              </button>
              <button
                type="button"
                className={MENU_ITEM}
                onClick={() => {
                  setSelectedSongIds(new Set(filteredSongs.map((s) => s.id)));
                  setContextMenu(null);
                }}
              >
                <CheckSquare className={MENU_ICON} />
                <span>{t("explorer.contextMenu.selectAll")}</span>
              </button>
              <Can permission="collection.update">
                <div className="my-1 border-t border-m3-border" />
                <button
                  type="button"
                  className={MENU_ITEM_DANGER}
                  onClick={() => {
                    const song = filteredSongs.find(
                      (s) => s.id === contextMenu.songId,
                    );
                    if (song) setSongToRemove(song);
                    setContextMenu(null);
                  }}
                >
                  <Trash2 className="w-4 h-4 text-m3-danger shrink-0" />
                  <span>{t("collectionsPage.removeFromCollection")}</span>
                </button>
              </Can>
            </>
          ) : (
            <>
              <button
                type="button"
                className={MENU_ITEM}
                onClick={() => {
                  setSelectedSongIds(new Set(filteredSongs.map((s) => s.id)));
                  setContextMenu(null);
                }}
              >
                <CheckSquare className={MENU_ICON} />
                <span>{t("explorer.contextMenu.selectAll")}</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
