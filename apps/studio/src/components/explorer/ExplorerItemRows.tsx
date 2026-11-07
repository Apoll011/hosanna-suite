import { Button } from "@/src/components/common";
import { SongScoreLayout } from "@/src/hooks/usePersonalSettings";
import { useI18n } from "@/src/lib/i18n";
import { Folder, Song } from "@/src/types";
import { FileMusic, MoreVertical } from "lucide-react";
import React from "react";
import {
  getFolderColorStyle,
  getFolderIconComponent,
} from "../../utils/folderCustomization";
import { SongScoreVisualizer } from "./SongScoreVisualizer";

export interface FolderTableRowProps {
  folder: Folder;
  isSelected: boolean;
  isSearchingOrFiltering?: boolean;
  isDropTarget?: boolean;
  isDropDisabled?: boolean;
  isInternalDragActive?: boolean;
  getFolderPathString?: (folderId: string | null | undefined) => string;
  density?: "comfortable" | "compact";
  showSongScore?: boolean;
  averageScore?: number | null;
  songScoreLayout?: SongScoreLayout;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

export const FolderTableRow: React.FC<FolderTableRowProps> = React.memo(
  ({
    folder,
    isSelected,
    isSearchingOrFiltering,
    isDropTarget,
    isDropDisabled,
    isInternalDragActive,
    getFolderPathString,
    density = "comfortable",
    showSongScore = false,
    averageScore = null,
    songScoreLayout = "ring",
    onClick,
    onDoubleClick,
    onContextMenu,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDragLeave,
    onDrop,
  }) => {
    const { t } = useI18n();
    const showDisabledDuringDrag = isInternalDragActive && isDropDisabled;
    const isCompact = density === "compact";
    const cellPadding = isCompact ? "py-2.5 px-4" : "py-4 px-6";

    return (
      <tr
        data-item-id={folder.id}
        data-item-type="folder"
        draggable={Boolean(onDragStart)}
        onClick={onClick}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onDoubleClick(e);
        }}
        onContextMenu={onContextMenu}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`cursor-pointer transition-colors group select-none ${
          isDropTarget && !isDropDisabled
            ? "bg-m3-primary/5 ring-2 ring-inset ring-m3-primary/30"
            : isSelected
              ? "bg-m3-primary/5 ring-2 ring-inset ring-m3-primary/30 text-m3-primary"
              : "hover:bg-m3-hover/50 text-m3-text"
        } ${showDisabledDuringDrag ? "opacity-40 cursor-not-allowed" : ""}`}
      >
        <td className={`${cellPadding} max-w-xs sm:max-w-md`}>
          {(() => {
            const IconComponent = getFolderIconComponent(folder.icon);
            const colorStyle = getFolderColorStyle(folder.color);
            return (
              <div className="flex items-center gap-3 min-w-0">
                <IconComponent
                  className={`${isCompact ? "w-4 h-4" : "w-5 h-5"} ${colorStyle.textClass} opacity-90 shrink-0`}
                />
                <span className="truncate font-medium">{folder.name}</span>
              </div>
            );
          })()}
        </td>
        <td className={`${cellPadding} text-m3-secondary opacity-70`}>
          {t("explorer.folder")}
        </td>
        {isSearchingOrFiltering && getFolderPathString && (
          <td className={`${cellPadding} text-m3-primary/80`}>
            {getFolderPathString(folder.parentId)}
          </td>
        )}
        <td className={`${cellPadding} text-m3-secondary`}>
          {t("explorer.songsCount", { count: folder.songCount || 0 })}
        </td>
        {showSongScore && (
          <td className={cellPadding}>
            {typeof averageScore === "number" ? (
              songScoreLayout === "bar" || songScoreLayout === "dots" ? (
                <div className="min-w-[80px] max-w-[120px]">
                  <SongScoreVisualizer
                    score={averageScore}
                    layout={songScoreLayout}
                    compact={isCompact}
                  />
                </div>
              ) : (
                <SongScoreVisualizer
                  score={averageScore}
                  layout={songScoreLayout}
                  compact={isCompact}
                />
              )
            ) : (
              <span className="text-m3-secondary">—</span>
            )}
          </td>
        )}
        <td className={`${cellPadding} text-right`}>
          <div className="flex items-center justify-end gap-1">
            <Button
              size={isCompact ? "sm" : "lg"}
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onDoubleClick(e);
              }}
            >
              {t("explorer.open")}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onContextMenu(e);
              }}
              title={t("explorer.moreOptions")}
              aria-label={t("explorer.moreOptions")}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </td>
      </tr>
    );
  },
);
FolderTableRow.displayName = "FolderTableRow";

export interface SongTableRowProps {
  song: Song;
  isSelected: boolean;
  isSearchingOrFiltering?: boolean;
  getFolderPathString?: (folderId: string | null | undefined) => string;
  density?: "comfortable" | "compact";
  /** Whether to show the song score visualizer */
  showSongScore?: boolean;
  /** Which layout to use for the score visualizer */
  songScoreLayout?: SongScoreLayout;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
}

export const SongTableRow: React.FC<SongTableRowProps> = React.memo(
  ({
    song,
    isSelected,
    isSearchingOrFiltering,
    getFolderPathString,
    density = "comfortable",
    showSongScore = false,
    songScoreLayout = "ring",
    onClick,
    onDoubleClick,
    onContextMenu,
    onDragStart,
    onDragEnd,
  }) => {
    const { t } = useI18n();
    const isCompact = density === "compact";
    const cellPadding = isCompact ? "py-2.5 px-4" : "py-4 px-6";
    const scoreValue = (song as { score?: { score: number } }).score?.score;
    const hasScore = showSongScore && scoreValue !== undefined;

    return (
      <tr
        data-item-id={song.id}
        data-item-type="song"
        draggable={Boolean(onDragStart)}
        onClick={onClick}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onDoubleClick(e);
        }}
        onContextMenu={onContextMenu}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        className={`cursor-pointer transition-colors group select-none ${
          isSelected
            ? "bg-m3-primary/5 ring-2 ring-inset ring-m3-primary/30 text-m3-primary"
            : "hover:bg-m3-hover/50 text-m3-text"
        }`}
      >
        <td className={`${cellPadding} max-w-xs sm:max-w-md`}>
          <div className="flex items-center gap-3 min-w-0">
            <FileMusic
              className={`${isCompact ? "w-4 h-4" : "w-5 h-5"} text-m3-primary opacity-80 shrink-0`}
            />
            <span className="truncate font-medium">{song.title}</span>
          </div>
        </td>
        <td className={`${cellPadding} text-m3-secondary opacity-70`}>
          {t("explorer.cifra")}
        </td>
        {isSearchingOrFiltering && getFolderPathString && (
          <td className={`${cellPadding} text-m3-secondary font-medium`}>
            {getFolderPathString(song.folderId)}
          </td>
        )}
        <td className={`${cellPadding} text-m3-secondary`}>
          {song.artist || "—"}
        </td>

        {showSongScore && (
          <td className={cellPadding}>
            {hasScore ? (
              songScoreLayout === "bar" || songScoreLayout === "dots" ? (
                <div className="min-w-[80px] max-w-[120px]">
                  <SongScoreVisualizer
                    score={scoreValue!}
                    layout={songScoreLayout}
                    compact={isCompact}
                  />
                </div>
              ) : (
                <SongScoreVisualizer
                  score={scoreValue!}
                  layout={songScoreLayout}
                  compact={isCompact}
                />
              )
            ) : (
              <span className="text-m3-secondary">—</span>
            )}
          </td>
        )}

        <td className={`${cellPadding} text-right`}>
          <div className="flex items-center justify-end gap-1">
            <Button
              size={isCompact ? "sm" : "lg"}
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onDoubleClick(e);
              }}
            >
              {t("explorer.edit")}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onContextMenu(e);
              }}
              title={t("explorer.moreOptions")}
              aria-label={t("explorer.moreOptions")}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </td>
      </tr>
    );
  },
);
SongTableRow.displayName = "SongTableRow";
