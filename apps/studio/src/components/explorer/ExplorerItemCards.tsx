import { Button } from "@/src/components/common";
import { SongScoreLayout } from "@/src/hooks/usePersonalSettings";
import { useI18n } from "@/src/lib/i18n";
import { Folder, Song } from "@/src/types";
import { FileMusicIcon, MoreVertical } from "lucide-react";
import React from "react";
import {
  getFolderColorStyle,
  getFolderIconComponent,
} from "../../utils/folderCustomization";
import { SongScoreVisualizer } from "./SongScoreVisualizer";

export interface FolderGridCardProps {
  folder: Folder;
  isSelected: boolean;
  isSearchingOrFiltering?: boolean;
  isDropTarget?: boolean;
  isDropDisabled?: boolean;
  isInternalDragActive?: boolean;
  getFolderPathString?: (folderId: string | null | undefined) => string;
  density?: "comfortable" | "compact";
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

export const FolderGridCard: React.FC<FolderGridCardProps> = React.memo(
  ({
    folder,
    isSelected,
    isSearchingOrFiltering,
    isDropTarget,
    isDropDisabled,
    isInternalDragActive,
    getFolderPathString,
    density = "comfortable",
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

    return (
      <div
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
        className={`${isCompact ? "p-3" : "p-4"} rounded-[var(--radius-lg)] border transition-colors cursor-pointer flex flex-col items-center text-center group relative select-none ${
          isDropTarget && !isDropDisabled
            ? "border-m3-primary border-dashed bg-m3-primary/5 ring-2 ring-m3-primary/30"
            : isSelected
              ? "border-m3-primary/40 bg-m3-primary/5 ring-2 ring-m3-primary/30"
              : "border-m3-border/50 bg-m3-card hover:bg-m3-hover hover:border-m3-primary/40"
        } ${showDisabledDuringDrag ? "opacity-40 cursor-not-allowed" : ""}`}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onContextMenu(e);
          }}
          className={`absolute ${isCompact ? "top-1 right-1" : "top-2 right-2"} z-10 ${
            isSelected
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
          }`}
          title={t("explorer.moreOptions")}
          aria-label={t("explorer.moreOptions")}
        >
          <MoreVertical className={isCompact ? "w-3.5 h-3.5" : "w-4.5 h-4.5"} />
        </Button>

        {(() => {
          const IconComponent = getFolderIconComponent(folder.icon);
          const colorStyle = getFolderColorStyle(folder.color);
          return (
            <div
              className={`${isCompact ? "w-9 h-9 mb-2" : "w-11 h-11 mb-2.5"} rounded-[var(--radius-md)] ${colorStyle.bgClass} border ${colorStyle.borderClass} flex items-center justify-center ${colorStyle.textClass}`}
            >
              <IconComponent
                className={`${isCompact ? "w-4 h-4" : "w-5 h-5"} opacity-90`}
              />
            </div>
          );
        })()}

        <span
          className={`${isCompact ? "text-xs" : "text-sm"} font-medium text-m3-text transition-colors truncate w-full px-1`}
        >
          {folder.name}
        </span>

        <span className="text-caption mt-0.5 opacity-70">
          {t("explorer.itemsCount", {
            count: (folder.songCount || 0) + (folder.folderCount || 0),
          })}
        </span>

        {isSearchingOrFiltering && getFolderPathString && (
          <span className="text-caption text-m3-primary bg-m3-primary/10 px-2 py-0.5 rounded-[var(--radius-md)] mt-2 truncate max-w-full">
            {getFolderPathString(folder.parentId)}
          </span>
        )}
      </div>
    );
  },
);
FolderGridCard.displayName = "FolderGridCard";

export interface SongGridCardProps {
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

export const SongGridCard: React.FC<SongGridCardProps> = React.memo(
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
    const scoreValue = (song as { score?: { score: number } }).score?.score;
    const hasScore = showSongScore && scoreValue !== undefined;
    const scoreCorner =
      hasScore && (songScoreLayout === "ring" || songScoreLayout === "badge");

    return (
      <div
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
        className={`${isCompact ? "p-3" : "p-4"} rounded-[var(--radius-lg)] border transition-colors cursor-pointer flex flex-col items-center text-center group relative overflow-hidden select-none ${
          isSelected
            ? "border-m3-primary/40 bg-m3-primary/5 ring-2 ring-m3-primary/30"
            : "border-m3-border/50 bg-m3-card hover:bg-m3-hover hover:border-m3-primary/40"
        }`}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onContextMenu(e);
          }}
          className={`absolute ${isCompact ? "top-1 right-1" : "top-2 right-2"} z-10 ${
            isSelected
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
          }`}
          title={t("explorer.moreOptions")}
          aria-label={t("explorer.moreOptions")}
        >
          <MoreVertical className={isCompact ? "w-3.5 h-3.5" : "w-4.5 h-4.5"} />
        </Button>

        {song.song_number && !hasScore && (
          <span className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5 font-medium bg-m3-hover text-m3-secondary rounded-[var(--radius-sm)] border border-m3-border tabular-nums">
            {t("explorer.songNumber", { number: song.song_number })}
          </span>
        )}

        {scoreCorner && (
          <div
            className={`absolute z-10 ${isCompact ? "top-2 left-2" : "top-2.5 left-2.5"}`}
          >
            <SongScoreVisualizer
              score={scoreValue!}
              layout={songScoreLayout}
              compact
            />
          </div>
        )}

        <div
          className={`${isCompact ? "w-9 h-9 mb-2" : "w-11 h-11 mb-2.5"} rounded-[var(--radius-md)] bg-m3-primary/10 border border-m3-primary/20 flex items-center justify-center text-m3-primary`}
        >
          <FileMusicIcon
            className={`${isCompact ? "w-4 h-4" : "w-5 h-5"} opacity-90`}
          />
        </div>

        <span
          className={`${isCompact ? "text-xs" : "text-sm"} font-medium text-m3-text transition-colors truncate w-full px-1`}
        >
          {song.title}
        </span>

        <span className="text-caption truncate w-full px-1 mt-0.5 opacity-70">
          {song.artist || t("explorer.cifra")}
          {hasScore && song.song_number
            ? ` · ${t("explorer.songNumber", { number: song.song_number })}`
            : ""}
        </span>

        {/* Bar / dots rendered below the artist name, full width */}
        {hasScore &&
          (songScoreLayout === "bar" || songScoreLayout === "dots") && (
            <div className="w-full px-1">
              <SongScoreVisualizer
                score={scoreValue!}
                layout={songScoreLayout}
                compact={isCompact}
              />
            </div>
          )}

        {isSearchingOrFiltering && getFolderPathString && (
          <span className="text-caption text-m3-secondary bg-m3-bg px-2 py-0.5 rounded-[var(--radius-md)] mt-2 truncate max-w-full border border-m3-border/50">
            {getFolderPathString(song.folderId)}
          </span>
        )}
      </div>
    );
  },
);
SongGridCard.displayName = "SongGridCard";
