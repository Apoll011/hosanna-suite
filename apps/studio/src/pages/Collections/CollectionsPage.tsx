/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Badge,
  ConfirmDialog,
  EmptyState,
  Spinner,
} from "@/src/components/common";
import { BatchActionFloatingBar } from "@/src/components/explorer/BatchActionFloatingBar";
import { MarqueeSelectionBox } from "@/src/components/explorer/MarqueeSelectionBox";
import { CreateCollectionModal } from "@/src/components/modals/CreateCollectionModal";
import { useAuth } from "@/src/contexts/AuthContext";
import { useAppNavigate } from "@/src/hooks/useAppNavigate";
import { useCollections } from "@/src/hooks/useCollections";
import { useMarqueeSelection } from "@/src/hooks/useMarqueeSelection";
import { useI18n } from "@/src/lib/i18n";
import { useCan } from "@/src/lib/permissions/client";
import { Can } from "@/src/lib/permissions/components";
import { Collection } from "@/src/types";
import {
  getFolderColorStyle,
  getFolderIconComponent,
} from "@/src/utils/folderCustomization";
import {
  CheckSquare,
  Edit2,
  FolderOpen,
  LibraryBig,
  MoreHorizontal,
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
import { useOutletContext } from "react-router-dom";

type CollectionSortBy = "updatedAt" | "title" | "number";

const MENU_ITEM =
  "w-full flex items-center gap-2.5 px-3 py-2 min-h-10 rounded-[var(--radius-md)] text-m3-text hover:bg-m3-hover font-medium transition-colors text-left cursor-pointer";
const MENU_ITEM_DANGER =
  "w-full flex items-center gap-2.5 px-3 py-2 min-h-10 rounded-[var(--radius-md)] text-m3-danger hover:bg-m3-danger/10 font-semibold transition-colors text-left cursor-pointer";
const MENU_ICON = "w-4 h-4 text-m3-secondary shrink-0";

export const CollectionsPage: React.FC = () => {
  const { navigate } = useAppNavigate();
  const { t } = useI18n();
  const { organization } = useAuth();
  const slugPrefix = organization?.slug ? `/${organization.slug}` : "";
  const { granted: canCreateCollection } = useCan("collection.create");
  const { granted: canDeleteCollection } = useCan("collection.delete");
  const { granted: canPrint } = useCan("export.pdf");

  const { searchQuery, sortBy, sortOrder, viewMode, density } =
    useOutletContext<{
      searchQuery: string;
      sortBy: CollectionSortBy;
      sortOrder?: "asc" | "desc";
      viewMode?: "grid" | "list";
      density?: "comfortable" | "compact";
    }>();

  const order = sortOrder ?? "asc";
  const mode = viewMode ?? "grid";
  const isCompact = (density ?? "comfortable") === "compact";

  const {
    collections,
    isLoading,
    createCollection,
    updateCollection,
    deleteCollection,
    printCollection,
    printCollections,
  } = useCollections();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(
    null,
  );
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastClickedId, setLastClickedId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    id: string | null;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { selectionBox, handleMouseDown } = useMarqueeSelection({
    containerRef,
    selectedIds,
    onSelectionChange: setSelectedIds,
    onClearSelection: () => setSelectedIds(new Set()),
  });

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    document.addEventListener("click", closeMenu);
    return () => document.removeEventListener("click", closeMenu);
  }, []);

  const filteredCollections = useMemo(() => {
    let result = [...collections];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.description && c.description.toLowerCase().includes(q)),
      );
    }

    result.sort((a, b) => {
      if (sortBy === "title") {
        const cmp = a.name.localeCompare(b.name);
        return order === "asc" ? cmp : -cmp;
      }
      if (sortBy === "number") {
        const countA = a.songCount ?? a.songIds?.length ?? 0;
        const countB = b.songCount ?? b.songIds?.length ?? 0;
        // Toolbar labels "Mais Músicas" as number-asc.
        const cmp = countB - countA;
        return order === "asc" ? cmp : -cmp;
      }
      const dateA = a.updatedAt || a.createdAt || "";
      const dateB = b.updatedAt || b.createdAt || "";
      const cmp = dateA.localeCompare(dateB);
      return order === "asc" ? cmp : -cmp;
    });

    return result;
  }, [collections, searchQuery, sortBy, order]);

  const openCollection = useCallback(
    (id: string) => {
      navigate(`${slugPrefix}/collections/${id}`);
    },
    [navigate, slugPrefix],
  );

  const handleItemClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (e.ctrlKey || e.metaKey) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
      setLastClickedId(id);
      return;
    }
    if (e.shiftKey && lastClickedId) {
      const ids = filteredCollections.map((c) => c.id);
      const a = ids.indexOf(lastClickedId);
      const b = ids.indexOf(id);
      if (a !== -1 && b !== -1) {
        const start = Math.min(a, b);
        const end = Math.max(a, b);
        setSelectedIds(new Set(ids.slice(start, end + 1)));
      } else {
        setSelectedIds(new Set([id]));
      }
      setLastClickedId(id);
      return;
    }
    setSelectedIds(new Set([id]));
    setLastClickedId(id);
  };

  const openContextMenu = (e: React.MouseEvent, collection?: Collection) => {
    e.preventDefault();
    e.stopPropagation();
    if (collection) {
      setSelectedIds((prev) =>
        prev.has(collection.id) && prev.size > 1
          ? prev
          : new Set([collection.id]),
      );
      setLastClickedId(collection.id);
    }
    const x = Math.min(e.clientX, window.innerWidth - 240);
    const y = Math.min(e.clientY, window.innerHeight - 240);
    setContextMenu({ x, y, id: collection?.id ?? null });
  };

  const requestDelete = useCallback(
    (ids: string[]) => {
      if (!canDeleteCollection || ids.length === 0) return;
      setPendingDeleteIds(ids);
      setContextMenu(null);
    },
    [canDeleteCollection],
  );

  const handleDeleteConfirm = async () => {
    const ids = [...pendingDeleteIds];
    setPendingDeleteIds([]);
    for (const id of ids) {
      await deleteCollection(id);
    }
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  };

  const printSelected = () => {
    const chosen = filteredCollections.filter((c) => selectedIds.has(c.id));
    if (chosen.length === 1) void printCollection(chosen[0]);
    else if (chosen.length > 1) void printCollections(chosen);
    setContextMenu(null);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setContextMenu(null);
        setSelectedIds(new Set());
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
        setSelectedIds(new Set(filteredCollections.map((c) => c.id)));
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedIds.size === 0) return;
        e.preventDefault();
        requestDelete(Array.from(selectedIds));
        return;
      }
      if (e.key === "Enter" && selectedIds.size === 1) {
        openCollection(Array.from(selectedIds)[0]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    filteredCollections,
    selectedIds,
    openCollection,
    canDeleteCollection,
    requestDelete,
  ]);

  const menuCollection = contextMenu?.id
    ? filteredCollections.find((c) => c.id === contextMenu.id)
    : undefined;
  const menuIsMulti = selectedIds.size > 1 && Boolean(contextMenu?.id);
  const deletingCollection = filteredCollections.find((c) =>
    pendingDeleteIds.includes(c.id),
  );

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-m3-bg">
        <Spinner size="lg" label={t("common.loading")} />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onContextMenu={(e) => {
        if ((e.target as HTMLElement).closest("[data-item-id]")) return;
        openContextMenu(e);
      }}
      className="flex-1 flex flex-col h-full overflow-y-auto bg-m3-bg select-none"
    >
      {filteredCollections.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center p-8">
          <EmptyState
            icon={<LibraryBig className="w-8 h-8" />}
            title={
              searchQuery
                ? t("foldersPage.noResults")
                : t("collectionsPage.noCollectionsAvailable")
            }
            description={
              searchQuery
                ? t("foldersPage.noResultsDesc", {
                    folder: t("common.collections"),
                    query: searchQuery,
                  })
                : t("collectionsPage.createCollectionFirst")
            }
            actionLabel={
              !searchQuery && canCreateCollection
                ? t("addressBar.newCollection")
                : undefined
            }
            onAction={
              !searchQuery && canCreateCollection
                ? () => setIsCreateModalOpen(true)
                : undefined
            }
          />
        </div>
      ) : mode === "list" ? (
        <div className={isCompact ? "p-3" : "p-6"}>
          <div className="bg-m3-card border border-m3-border rounded-[var(--radius-lg)] overflow-hidden divide-y divide-m3-border/60">
            {filteredCollections.map((collection) => (
              <CollectionRow
                key={collection.id}
                collection={collection}
                isSelected={selectedIds.has(collection.id)}
                isCompact={isCompact}
                onClick={(e) => handleItemClick(e, collection.id)}
                onDoubleClick={() => openCollection(collection.id)}
                onContextMenu={(e) => openContextMenu(e, collection)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className={isCompact ? "p-3" : "p-6"}>
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${
              isCompact ? "gap-2" : "gap-4"
            }`}
          >
            {filteredCollections.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                isSelected={selectedIds.has(collection.id)}
                isCompact={isCompact}
                onClick={(e) => handleItemClick(e, collection.id)}
                onDoubleClick={() => openCollection(collection.id)}
                onContextMenu={(e) => openContextMenu(e, collection)}
              />
            ))}
          </div>
        </div>
      )}

      {contextMenu && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-[80] w-56 bg-m3-card border border-m3-border rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] p-1.5 flex flex-col gap-0.5 text-xs select-none hosanna-enter"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          {contextMenu.id === null ? (
            <>
              <div className="px-3 py-1.5 text-label text-m3-secondary border-b border-m3-border mb-0.5 truncate">
                {t("common.collections")}
              </div>
              <Can permission="collection.create">
                <button
                  type="button"
                  className={MENU_ITEM}
                  onClick={() => {
                    setContextMenu(null);
                    setIsCreateModalOpen(true);
                  }}
                >
                  <Plus className={MENU_ICON} />
                  <span>{t("addressBar.newCollection")}</span>
                </button>
              </Can>
              <button
                type="button"
                className={MENU_ITEM}
                onClick={() => {
                  setSelectedIds(new Set(filteredCollections.map((c) => c.id)));
                  setContextMenu(null);
                }}
              >
                <CheckSquare className={MENU_ICON} />
                <span>{t("explorer.contextMenu.selectAll")}</span>
              </button>
            </>
          ) : menuIsMulti ? (
            <>
              <div className="px-3 py-1.5 text-label text-m3-secondary border-b border-m3-border mb-0.5 truncate flex items-center justify-between">
                <span>{t("explorer.contextMenu.multiSelect")}</span>
                <Badge variant="accent">{selectedIds.size}</Badge>
              </div>
              <Can permission="export.pdf">
                <button
                  type="button"
                  className={MENU_ITEM}
                  onClick={printSelected}
                >
                  <Printer className={MENU_ICON} />
                  <span>{t("common.print")}</span>
                </button>
              </Can>
              <Can permission="collection.delete">
                <div className="my-1 border-t border-m3-border" />
                <button
                  type="button"
                  className={MENU_ITEM_DANGER}
                  onClick={() => requestDelete(Array.from(selectedIds))}
                >
                  <Trash2 className="w-4 h-4 text-m3-danger shrink-0" />
                  <span>{t("collectionsPage.delete")}</span>
                </button>
              </Can>
              <button
                type="button"
                className={MENU_ITEM}
                onClick={() => {
                  setSelectedIds(new Set());
                  setContextMenu(null);
                }}
              >
                <X className={MENU_ICON} />
                <span>{t("explorer.contextMenu.deselect")}</span>
              </button>
            </>
          ) : menuCollection ? (
            <>
              <div className="px-3 py-1.5 text-label text-m3-secondary border-b border-m3-border mb-0.5 truncate">
                {menuCollection.name}
              </div>
              <button
                type="button"
                className={MENU_ITEM}
                onClick={() => {
                  setContextMenu(null);
                  openCollection(menuCollection.id);
                }}
              >
                <FolderOpen className={MENU_ICON} />
                <span>{t("explorer.open")}</span>
              </button>
              <Can permission="collection.update">
                <button
                  type="button"
                  className={MENU_ITEM}
                  onClick={() => {
                    setContextMenu(null);
                    setEditingCollection(menuCollection);
                  }}
                >
                  <Edit2 className={MENU_ICON} />
                  <span>{t("collectionsPage.edit")}</span>
                </button>
              </Can>
              <Can permission="export.pdf">
                <button
                  type="button"
                  className={MENU_ITEM}
                  onClick={() => {
                    setContextMenu(null);
                    void printCollection(menuCollection);
                  }}
                >
                  <Printer className={MENU_ICON} />
                  <span>{t("print.buttons.printCollection")}</span>
                </button>
              </Can>
              <Can permission="collection.delete">
                <div className="my-1 border-t border-m3-border" />
                <button
                  type="button"
                  className={MENU_ITEM_DANGER}
                  onClick={() => requestDelete([menuCollection.id])}
                >
                  <Trash2 className="w-4 h-4 text-m3-danger shrink-0" />
                  <span>{t("collectionsPage.delete")}</span>
                </button>
              </Can>
            </>
          ) : null}
        </div>
      )}

      <BatchActionFloatingBar
        selectedCount={selectedIds.size}
        itemLabel={t("common.collections")}
        onPrint={canPrint ? printSelected : undefined}
        onDelete={() => requestDelete(Array.from(selectedIds))}
        onCancel={() => setSelectedIds(new Set())}
      />
      <MarqueeSelectionBox box={selectionBox} />

      <CreateCollectionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={async (data) => {
          await createCollection(data);
        }}
      />

      {editingCollection && (
        <CreateCollectionModal
          isOpen={Boolean(editingCollection)}
          collection={editingCollection}
          onClose={() => setEditingCollection(null)}
          onSave={async (data) => {
            await updateCollection({ id: editingCollection.id, ...data });
            setEditingCollection(null);
          }}
        />
      )}

      <ConfirmDialog
        isOpen={pendingDeleteIds.length > 0}
        onClose={() => setPendingDeleteIds([])}
        onConfirm={handleDeleteConfirm}
        title={
          pendingDeleteIds.length > 1
            ? t("collectionsPage.deleteManyTitle")
            : t("collectionsPage.deleteTitle")
        }
        message={
          pendingDeleteIds.length > 1
            ? t("collectionsPage.deleteManyMessage", {
                count: pendingDeleteIds.length,
              })
            : t("collectionsPage.deleteMessage", {
                name: deletingCollection?.name ?? "",
              })
        }
        confirmText={t("collectionsPage.delete")}
        cancelText={t("common.cancel")}
        variant="danger"
      />
    </div>
  );
};

interface CollectionItemProps {
  collection: Collection;
  isSelected: boolean;
  isCompact: boolean;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

const CollectionCard: React.FC<CollectionItemProps> = ({
  collection,
  isSelected,
  isCompact,
  onClick,
  onDoubleClick,
  onContextMenu,
}) => {
  const { t } = useI18n();
  const IconComp = getFolderIconComponent(collection.icon);
  const colorStyle = getFolderColorStyle(collection.color);
  const songCount = collection.songCount ?? collection.songIds?.length ?? 0;

  return (
    <div
      data-item-id={collection.id}
      onClick={onClick}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick();
      }}
      onContextMenu={onContextMenu}
      className={`group relative rounded-[var(--radius-lg)] border bg-m3-card overflow-hidden transition-colors duration-200 cursor-pointer flex flex-col ${
        isSelected
          ? "border-m3-primary/40 bg-m3-primary/5 ring-2 ring-m3-primary/30"
          : "border-m3-border/80 hover:border-m3-primary/40"
      }`}
    >
      {collection.image && (
        <div
          className={`relative w-full overflow-hidden bg-m3-sidebar ${
            isCompact ? "h-24" : "h-36"
          }`}
        >
          <img
            src={collection.image}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.parentElement?.classList.add("hidden");
            }}
          />
        </div>
      )}

      <div
        className={`relative flex-1 flex flex-col ${isCompact ? "px-3 py-2.5" : "px-4 py-3.5"}`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`${isCompact ? "w-8 h-8" : "w-10 h-10"} rounded-[var(--radius-md)] flex items-center justify-center shrink-0 border`}
            style={{
              backgroundColor: `${colorStyle.colorHex}18`,
              color: colorStyle.colorHex,
              borderColor: `${colorStyle.colorHex}33`,
            }}
          >
            <IconComp className={isCompact ? "w-4 h-4" : "w-5 h-5"} />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h4
              className={`${isCompact ? "text-xs" : "text-sm"} font-semibold text-m3-text line-clamp-1 group-hover:text-m3-primary transition-colors`}
            >
              {collection.name}
            </h4>
            <span className="text-caption mt-0.5 block">
              {t(
                `collectionsPage.songCount.${songCount === 1 ? "one" : "other"}`,
                { count: songCount },
              )}
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onContextMenu(e);
            }}
            onDoubleClick={(e) => e.stopPropagation()}
            className={`min-h-10 min-w-10 inline-flex items-center justify-center rounded-[var(--radius-md)] text-m3-secondary hover:text-m3-text hover:bg-m3-hover transition-colors cursor-pointer ${
              isSelected
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
            }`}
            aria-label={t("explorer.moreOptions")}
            title={t("explorer.moreOptions")}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
        {collection.description && !isCompact && (
          <p className="text-caption line-clamp-2 mt-2.5 leading-relaxed">
            {collection.description}
          </p>
        )}
      </div>
    </div>
  );
};

const CollectionRow: React.FC<CollectionItemProps> = ({
  collection,
  isSelected,
  isCompact,
  onClick,
  onDoubleClick,
  onContextMenu,
}) => {
  const { t } = useI18n();
  const IconComp = getFolderIconComponent(collection.icon);
  const colorStyle = getFolderColorStyle(collection.color);
  const songCount = collection.songCount ?? collection.songIds?.length ?? 0;

  return (
    <div
      data-item-id={collection.id}
      onClick={onClick}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick();
      }}
      onContextMenu={onContextMenu}
      className={`group flex items-center gap-3 cursor-pointer transition-colors ${
        isCompact ? "px-3 py-2" : "px-4 py-3.5"
      } ${isSelected ? "bg-m3-primary/5 text-m3-primary" : "hover:bg-m3-hover/50 text-m3-text"}`}
    >
      {collection.image ? (
        <img
          src={collection.image}
          alt=""
          className={`${isCompact ? "w-8 h-8" : "w-10 h-10"} rounded-[var(--radius-md)] object-cover shrink-0 bg-m3-sidebar`}
        />
      ) : (
        <div
          className={`${isCompact ? "w-8 h-8" : "w-10 h-10"} rounded-[var(--radius-md)] flex items-center justify-center shrink-0 border`}
          style={{
            backgroundColor: `${colorStyle.colorHex}18`,
            color: colorStyle.colorHex,
            borderColor: `${colorStyle.colorHex}33`,
          }}
        >
          <IconComp className={isCompact ? "w-4 h-4" : "w-5 h-5"} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div
          className={`${isCompact ? "text-xs" : "text-sm"} font-medium truncate`}
        >
          {collection.name}
        </div>
        {!isCompact && collection.description && (
          <div className="text-caption truncate">{collection.description}</div>
        )}
      </div>
      <span className="text-caption shrink-0">
        {t(`collectionsPage.songCount.${songCount === 1 ? "one" : "other"}`, {
          count: songCount,
        })}
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onContextMenu(e);
        }}
        className="min-h-10 min-w-10 inline-flex items-center justify-center rounded-[var(--radius-md)] text-m3-secondary hover:text-m3-text hover:bg-m3-hover cursor-pointer"
        aria-label={t("explorer.moreOptions")}
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
    </div>
  );
};
