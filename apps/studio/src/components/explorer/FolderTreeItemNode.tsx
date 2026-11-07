import { useI18n } from "@/src/lib/i18n";
import { Folder } from "@/src/types";
import {
  ChevronDown,
  ChevronRight,
  Folder as FolderIcon,
  FolderOpen,
  MoreVertical,
} from "lucide-react";
import React from "react";
import {
  getFolderColorStyle,
  getFolderIconComponent,
} from "../../utils/folderCustomization";

export interface FolderTreeNode {
  folder: Folder;
  level: number;
  children: FolderTreeNode[];
}

export function buildFolderTree(folders?: Folder[] | null): FolderTreeNode[] {
  const childrenMap = new Map<string | null, Folder[]>();
  const safeFolders = Array.isArray(folders) ? folders : [];

  safeFolders.forEach((f) => {
    const parentId = f.parentId || null;
    if (!childrenMap.has(parentId)) {
      childrenMap.set(parentId, []);
    }
    childrenMap.get(parentId)!.push(f);
  });

  function getNodes(parentId: string | null, level: number): FolderTreeNode[] {
    const list = childrenMap.get(parentId) || [];
    return list.map((folder) => ({
      folder,
      level,
      children: getNodes(folder.id, level + 1),
    }));
  }

  return getNodes(null, 0);
}

/**
 * Return the ordered ancestor chain for a folder (root-most first).
 * Empty when there is no folder id (i.e. the root itself).
 */
export function getFolderAncestors(
  folderId: string | null | undefined,
  folders?: Folder[] | null,
): Folder[] {
  if (!folderId || !Array.isArray(folders)) return [];
  const trail: Folder[] = [];
  const visited = new Set<string>();
  let current = folders.find((f) => f.id === folderId);

  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    trail.unshift(current);
    current = current.parentId
      ? folders.find((f) => f.id === current?.parentId)
      : undefined;
  }

  return trail;
}

export function getFolderDescendantIds(
  folderId: string,
  folders?: Folder[] | null,
): Set<string> {
  const descendantIds = new Set<string>([folderId]);
  if (!Array.isArray(folders)) return descendantIds;
  let addedNew = true;

  while (addedNew) {
    addedNew = false;
    folders.forEach((f) => {
      if (
        f.parentId &&
        descendantIds.has(f.parentId) &&
        !descendantIds.has(f.id)
      ) {
        descendantIds.add(f.id);
        addedNew = true;
      }
    });
  }

  return descendantIds;
}

export const FolderTreeItemNode: React.FC<{
  node: FolderTreeNode;
  currentFolderId: string | null;
  onSelectFolder: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, type: "folder", item: Folder) => void;
  expandedFolderIds: Set<string>;
  toggleExpand: (id: string) => void;
}> = React.memo(
  ({
    node,
    currentFolderId,
    onSelectFolder,
    onContextMenu,
    expandedFolderIds,
    toggleExpand,
  }) => {
    const { t } = useI18n();
    const isActive = currentFolderId === node.folder.id;
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedFolderIds.has(node.folder.id);

    return (
      <div className="flex flex-col w-full">
        <div
          className={`w-full flex items-center justify-between py-2 pr-3 rounded-[var(--radius-xl)] text-[13px] font-bold transition-colors cursor-pointer group ${
            isActive
              ? "bg-m3-primary/10 text-m3-primary border border-m3-primary/20 shadow-[var(--shadow-sm)]"
              : "text-m3-secondary hover:bg-m3-hover hover:text-m3-text"
          }`}
          style={{ paddingLeft: `${8 + node.level * 16}px` }}
          onClick={() => onSelectFolder(node.folder.id)}
          onContextMenu={(e) => onContextMenu(e, "folder", node.folder)}
        >
          <div className="flex items-center gap-2 truncate pr-1 min-w-0 flex-1">
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(node.folder.id);
                }}
                className="p-1 hover:bg-m3-primary/20 rounded-lg text-m3-secondary hover:text-m3-primary transition-colors shrink-0"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            ) : (
              <span className="w-6 h-6 shrink-0" />
            )}

            {(() => {
              const IconComp = isActive
                ? node.folder.icon && node.folder.icon !== "default"
                  ? getFolderIconComponent(node.folder.icon)
                  : FolderOpen
                : getFolderIconComponent(node.folder.icon);
              const colorStyle = getFolderColorStyle(node.folder.color);

              return (
                <IconComp
                  className={`w-4.5 h-4.5 shrink-0 transition-colors ${
                    isActive
                      ? `${colorStyle.textClass}`
                      : `${colorStyle.textClass} opacity-75 group-hover:opacity-100`
                  }`}
                />
              );
            })()}
            <span className="truncate tracking-tight">{node.folder.name}</span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] text-m3-secondary font-semibold opacity-60 group-hover:hidden transition-opacity">
              {node.folder.songCount || 0}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onContextMenu(e, "folder", node.folder);
              }}
              className="hidden group-hover:flex p-1 rounded-lg hover:bg-m3-primary/20 text-m3-secondary hover:text-m3-primary transition-colors cursor-pointer"
              title={t("explorer.moreOptions")}
              aria-label={t("explorer.moreOptions")}
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="flex flex-col w-full gap-1 mt-1">
            {node.children.map((child) => (
              <FolderTreeItemNode
                key={child.folder.id}
                node={child}
                currentFolderId={currentFolderId}
                onSelectFolder={onSelectFolder}
                onContextMenu={onContextMenu}
                expandedFolderIds={expandedFolderIds}
                toggleExpand={toggleExpand}
              />
            ))}
          </div>
        )}
      </div>
    );
  },
);
FolderTreeItemNode.displayName = "FolderTreeItemNode";

export const MoveFolderTreeItem: React.FC<{
  node: FolderTreeNode;
  selectedFolderId: string | null;
  onSelect: (id: string) => void;
  disabledFolderIds?: Set<string>;
  expandedFolderIds: Set<string>;
  toggleExpand: (id: string) => void;
}> = React.memo(
  ({
    node,
    selectedFolderId,
    onSelect,
    disabledFolderIds,
    expandedFolderIds,
    toggleExpand,
  }) => {
    const isDisabled = disabledFolderIds?.has(node.folder.id);
    const isSelected = selectedFolderId === node.folder.id;
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedFolderIds.has(node.folder.id);

    return (
      <div className="flex flex-col w-full">
        <label
          style={{ paddingLeft: `${12 + node.level * 16}px` }}
          className={`flex items-center gap-2.5 p-2.5 border rounded-xl transition-colors ${
            isDisabled
              ? "opacity-40 bg-m3-sidebar border-m3-border cursor-not-allowed"
              : isSelected
                ? "bg-m3-primary/10 border-m3-primary/40 cursor-pointer"
                : "border-m3-border hover:bg-m3-hover cursor-pointer"
          }`}
        >
          <input
            type="radio"
            name="moveTargetRadio"
            disabled={isDisabled}
            checked={isSelected}
            onChange={() => !isDisabled && onSelect(node.folder.id)}
            className="text-m3-primary focus:ring-m3-primary"
          />

          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleExpand(node.folder.id);
              }}
              className="p-0.5 hover:bg-m3-hover rounded text-m3-secondary transition-colors shrink-0"
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          ) : (
            <span className="w-3.5 h-3.5 shrink-0" />
          )}

          <FolderIcon className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="text-xs font-bold text-m3-text truncate">
            {node.folder.name}
          </span>
        </label>

        {hasChildren && isExpanded && (
          <div className="flex flex-col gap-1.5 mt-1.5">
            {node.children.map((child) => (
              <MoveFolderTreeItem
                key={child.folder.id}
                node={child}
                selectedFolderId={selectedFolderId}
                onSelect={onSelect}
                disabledFolderIds={disabledFolderIds}
                expandedFolderIds={expandedFolderIds}
                toggleExpand={toggleExpand}
              />
            ))}
          </div>
        )}
      </div>
    );
  },
);
MoveFolderTreeItem.displayName = "MoveFolderTreeItem";
