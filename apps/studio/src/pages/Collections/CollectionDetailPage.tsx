/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ConfirmDialog, EmptyState, Spinner, Table } from "@/src/components/common";
import type { CollectionToolbarActions } from "@/src/components/layout";
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
  CheckSquare,
  ExternalLink,
  FolderKanban,
  MoreHorizontal,
  Music2,
  Trash2,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

  const { data: collection, isLoading: isCollectionLoading } = useCollection(id || null);

  const {
    searchQuery = "",
    sortBy = "title",
    sortOrder = "asc",
    selectedKey = "",
    selectedTag = "",
    density = "comfortable",
    setCollectionToolbarActions,
  } = useOutletContext<{
    searchQuery?: string;
    sortBy?: "title" | "artist" | "updatedAt" | "number";
    sortOrder?: "asc" | "desc";
    selectedKey?: string | null;
    selectedTag?: string | null;
    density?: "comfortable" | "compact";
    setCollectionToolbarActions?: (actions: CollectionToolbarActions | null) => void;
  }>() ?? {};
  const isCompact = density === "compact";
  const rowPad = isCompact ? "px-4 py-2.5" : "px-6 py-3.5";
  const rowText = isCompact ? "text-xs" : "text-sm";

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
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Modals & menus
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddSongsModalOpen, setIsAddSongsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [songToRemove, setSongToRemove] = useState<Song | null>(null);
  const [pendingRemoveIds, setPendingRemoveIds] = useState<string[]>([]);
  const [selectedSongIds, setSelectedSongIds] = useState<Set<string>>(new Set());
  const [lastClickedId, setLastClickedId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    songId: string | null;
  } | null>(null);
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
      const target = e.target as HTMLElement | null;
      if (!target?.closest?.("[data-song-context-menu]")) {
        setContextMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset page when search / filters / sort change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedSongIds(new Set());
    setLastClickedId(null);
  }, [searchQuery, sortBy, sortOrder, selectedKey, selectedTag]);

  // Songs in this collection (union of both sides of the relationship)
  const songsInCollection = useMemo(() => {
    if (!collection) return [];
    const songIdSet = new Set(collection.songIds || []);
    return allSongs.filter(
      (song) =>
        songIdSet.has(song.id) ||
        (Array.isArray(song.collectionIds) && song.collectionIds.includes(collection.id)),
    );
  }, [collection, allSongs]);

  // Register collection actions on the explorer toolbar (replaces the old identity header)
  useEffect(() => {
    if (!collection || !setCollectionToolbarActions) return;
    setCollectionToolbarActions({
      onAddSongs: () => setIsAddSongsModalOpen(true),
      onPrint: () => {
        void printCollection(collection, songsInCollection);
      },
      onEdit: () => setIsEditModalOpen(true),
      onDelete: () => setIsDeleteDialogOpen(true),
    });
    return () => setCollectionToolbarActions(null);
  }, [collection, songsInCollection, printCollection, setCollectionToolbarActions]);

  // Search, key/tag filters, and sort
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
    if (selectedKey) {
      result = result.filter((s) => {
        const k = s.content?.match(/\{key:\s*([^}]+)\}/i)?.[1]?.trim();
        return k === selectedKey;
      });
    }
    if (selectedTag) {
      result = result.filter((s) => s.tags?.includes(selectedTag));
    }

    if (result.length > 1) {
      result = [...result].sort((a, b) => {
        let valA: string | number = "";
        let valB: string | number = "";
        if (sortBy === "artist") {
          valA = a.artist?.toLowerCase() ?? "";
          valB = b.artist?.toLowerCase() ?? "";
        } else if (sortBy === "updatedAt") {
          valA = new Date(a.updatedAt).getTime();
          valB = new Date(b.updatedAt).getTime();
        } else if (sortBy === "number") {
          valA = a.song_number ?? Infinity;
          valB = b.song_number ?? Infinity;
        } else {
          valA = a.title?.toLowerCase() ?? "";
          valB = b.title?.toLowerCase() ?? "";
        }
        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [songsInCollection, searchQuery, selectedKey, selectedTag, sortBy, sortOrder]);

  // Pagination
  const totalSongs = filteredSongs.length;
  const effectivePerPage = itemsPerPage === 0 ? Math.max(1, totalSongs) : itemsPerPage;
  const paginatedSongs = useMemo(() => {
    if (itemsPerPage === 0) return filteredSongs;
    const start = (currentPage - 1) * effectivePerPage;
    return filteredSongs.slice(start, start + effectivePerPage);
  }, [filteredSongs, currentPage, effectivePerPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

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
          setSelectedSongIds(new Set(ids.slice(Math.min(a, b), Math.max(a, b) + 1)));
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
        target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
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
  }, [filteredSongs, selectedSongIds, canUpdateCollection, navigate, slugPrefix]);

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

  const isFiltering = searchQuery.trim() !== "" || Boolean(selectedKey) || Boolean(selectedTag);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      className="flex-1 flex flex-col h-full overflow-hidden bg-m3-bg select-none"
    >
      <div className="flex-1 min-h-0 flex flex-col px-4 sm:px-6 py-4">
        <Table
          empty={
            paginatedSongs.length === 0 ? (
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
                  !isFiltering && canUpdateCollection ? t("collectionsPage.addSongs") : undefined
                }
                onAction={
                  !isFiltering && canUpdateCollection
                    ? () => setIsAddSongsModalOpen(true)
                    : undefined
                }
              />
            ) : undefined
          }
          header={
            <div
              className={`grid grid-cols-[2rem_1fr_auto] sm:grid-cols-[2rem_1fr_auto_6.5rem] gap-3 items-center border-b border-m3-border bg-m3-sidebar/40 shrink-0 ${rowPad}`}
            >
              <span className="text-label text-center">#</span>
              <span className="text-label">{t("songsPage.titlePath")}</span>
              <span className="hidden sm:block text-label text-right">{t("songsPage.tags")}</span>
              <span className="text-label text-right">{t("songsPage.actions")}</span>
            </div>
          }
          pagination={{
            page: currentPage,
            totalItems: totalSongs,
            itemsPerPage,
            onPageChange: setCurrentPage,
            onItemsPerPageChange: setItemsPerPage,
            itemLabel: t("songsPage.songsWord"),
            emptyLabel: t("songsPage.zeroSongs"),
          }}
        >
          <div className={`divide-y divide-m3-border/30 font-semibold ${rowText}`}>
            {paginatedSongs.map((song, index) => {
              const globalIndex = (currentPage - 1) * effectivePerPage + index + 1;
              const keyMatch = song.content?.match(/\{key:\s*([^}]+)\}/i)?.[1]?.trim();
              const isSelected = selectedSongIds.has(song.id);

              return (
                <div
                  key={song.id}
                  data-item-id={song.id}
                  onClick={(e) => handleSongClick(e, song)}
                  onDoubleClick={() => navigate(`${slugPrefix}/songs/${song.id}`)}
                  onContextMenu={(e) => openContextMenu(e, song)}
                  className={`grid grid-cols-[2rem_1fr_auto] sm:grid-cols-[2rem_1fr_auto_6.5rem] gap-3 items-center transition-colors select-none cursor-pointer ${rowPad} ${
                    isSelected
                      ? "bg-m3-primary/5 ring-2 ring-inset ring-m3-primary/30 text-m3-primary"
                      : "text-m3-text hover:bg-m3-hover/50"
                  }`}
                >
                  <span className="text-center text-caption tabular-nums">{globalIndex}</span>

                  <div className="flex flex-col min-w-0">
                    <span className="truncate font-semibold">{song.title}</span>
                    <span className="text-caption mt-0.5 truncate">{song.artist || "—"}</span>
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
                      <span className="text-caption">+{(song.tags?.length ?? 0) - 2}</span>
                    )}
                  </div>

                  <div
                    className="flex items-center justify-end gap-1"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => navigate(`${slugPrefix}/songs/${song.id}`)}
                      className="p-1.5 text-m3-secondary hover:text-m3-text hover:bg-m3-hover rounded-md cursor-pointer transition-colors"
                      title={t("collectionsPage.viewSong")}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                    <Can permission="collection.update">
                      <button
                        type="button"
                        onClick={() => setSongToRemove(song)}
                        className="p-1.5 text-m3-secondary hover:text-m3-danger hover:bg-m3-danger/10 rounded-md cursor-pointer transition-colors"
                        title={t("collectionsPage.removeFromCollection")}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </Can>
                    <button
                      type="button"
                      onClick={(e) => openContextMenu(e, song)}
                      className="p-1.5 rounded-md text-m3-secondary hover:text-m3-text hover:bg-m3-hover transition-colors cursor-pointer"
                      title={t("explorer.moreOptions")}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Table>
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

      {contextMenu &&
        createPortal(
          <div
            data-song-context-menu
            style={{ top: contextMenu.y, left: contextMenu.x }}
            className="fixed z-100 w-56 bg-m3-card border border-m3-border rounded-xl shadow-lg p-1.5 flex flex-col gap-0.5 text-xs select-none hosanna-enter"
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
                  {filteredSongs.find((s) => s.id === contextMenu.songId)?.title ?? ""}
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
                      const song = filteredSongs.find((s) => s.id === contextMenu.songId);
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
          </div>,
          document.body,
        )}
    </div>
  );
};
