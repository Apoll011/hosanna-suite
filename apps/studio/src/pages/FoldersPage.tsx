import { EmptyState, Spinner } from "@/src/components/common";
import { useI18n } from "@/src/lib/i18n";
import { Folder, Song } from "@/src/types";
import { FolderOpen, Upload } from "lucide-react";
import React from "react";
import { useOutletContext } from "react-router-dom";
import {
  FolderGridCard,
  FolderTableRow,
  SongGridCard,
  SongTableRow,
} from "../components/explorer";
import { useAuth } from "../contexts/AuthContext";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { usePersonalSettings } from "../hooks/usePersonalSettings";
import { Can, CanAll } from "../lib/permissions/components";
import { useCan } from "../lib/permissions/client";

interface FolderExplorerContext {
  filteredSubfolders: Folder[];
  filteredFiles: Song[];
  viewMode: "grid" | "list";
  density?: "comfortable" | "compact";
  isSearchingOrFiltering: boolean;
  currentFolder: Folder | undefined;
  searchQuery: string;
  handleItemClick: (
    e: React.MouseEvent,
    id: string,
    type: "folder" | "song",
  ) => void;
  handleSelectFolder: (id: string | null) => void;
  handleContextMenu: (
    e: React.MouseEvent,
    type: "folder" | "song",
    item: Folder | Song,
  ) => void;
  getFolderPathString: (folderId: string | null | undefined) => string;
  selectedFolderIds: Set<string>;
  selectedSongIds: Set<string>;
  foldersQuery: { isLoading: boolean };
  songsQuery: {
    isLoading: boolean;
    data?: { songs?: Song[] };
  };
  setIsCreateSongModalOpen: (open: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  containerRef: React.RefObject<HTMLDivElement>;
  handleWorkspaceMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleCanvasContextMenu: (e: React.MouseEvent) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  isDraggingOver: boolean;
  totalItemsCount: number;
  currentFolderId: string | null;
  selectionBox: { x: number; y: number; width: number; height: number } | null;

  /* Internal item drag & drop */
  isInternalDragActive: boolean;
  dropTargetFolderId: string | null;
  dragDisabledFolderIds: Set<string>;
  handleItemDragStart: (
    e: React.DragEvent,
    id: string,
    type: "folder" | "song",
  ) => void;
  handleItemDragEnd: () => void;
  handleFolderDragOver: (e: React.DragEvent, folderId: string) => void;
  handleFolderDragLeave: (e: React.DragEvent, folderId: string) => void;
  handleFolderDrop: (e: React.DragEvent, folderId: string) => void;
}

const DEFAULT_CONTEXT: FolderExplorerContext = {
  filteredSubfolders: [],
  filteredFiles: [],
  viewMode: "grid",
  density: "comfortable",
  isSearchingOrFiltering: false,
  currentFolder: undefined,
  searchQuery: "",
  handleItemClick: () => {},
  handleSelectFolder: () => {},
  handleContextMenu: () => {},
  getFolderPathString: () => "",
  selectedFolderIds: new Set(),
  selectedSongIds: new Set(),
  foldersQuery: { isLoading: false },
  songsQuery: { isLoading: false },
  setIsCreateSongModalOpen: () => {},
  fileInputRef: { current: null },
  containerRef: { current: null },
  handleWorkspaceMouseDown: () => {},
  handleCanvasContextMenu: () => {},
  handleDragOver: () => {},
  handleDragLeave: () => {},
  handleDrop: () => {},
  isDraggingOver: false,
  totalItemsCount: 0,
  currentFolderId: null,
  selectionBox: null,
  isInternalDragActive: false,
  dropTargetFolderId: null,
  dragDisabledFolderIds: new Set(),
  handleItemDragStart: () => {},
  handleItemDragEnd: () => {},
  handleFolderDragOver: () => {},
  handleFolderDragLeave: () => {},
  handleFolderDrop: () => {},
};

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export const FoldersPage: React.FC = () => {
  const { navigate } = useAppNavigate();
  const { t } = useI18n();
  const context = useOutletContext<FolderExplorerContext>() ?? DEFAULT_CONTEXT;
  const { organization } = useAuth();
  const { settings: personalSettings } = usePersonalSettings();
  const { granted: canViewLibraryHealth } = useCan("library.health");
  const { granted: canCreateSong } = useCan("song.create");
  const slugPrefix = organization?.slug ? `/${organization.slug}` : "";
  const showSongScore = canViewLibraryHealth && personalSettings.showSongScore;

  const {
    filteredSubfolders,
    filteredFiles,
    viewMode,
    density = "comfortable",
    isSearchingOrFiltering,
    currentFolder,
    searchQuery,
    handleItemClick,
    handleSelectFolder,
    handleContextMenu,
    getFolderPathString,
    selectedFolderIds,
    selectedSongIds,
    foldersQuery,
    songsQuery,
    setIsCreateSongModalOpen,
    fileInputRef,
    containerRef,
    handleWorkspaceMouseDown,
    handleCanvasContextMenu,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    isDraggingOver,
    totalItemsCount,
    currentFolderId,
    isInternalDragActive,
    dropTargetFolderId,
    dragDisabledFolderIds,
    handleItemDragStart,
    handleItemDragEnd,
    handleFolderDragOver,
    handleFolderDragLeave,
    handleFolderDrop,
  } = context;

  const folderAverageScores = React.useMemo(() => {
    const songs = songsQuery.data?.songs ?? [];
    const buckets = new Map<string, { sum: number; count: number }>();
    for (const song of songs) {
      const value = song.score?.score;
      if (!song.folderId || typeof value !== "number") continue;
      const bucket = buckets.get(song.folderId) ?? { sum: 0, count: 0 };
      bucket.sum += value;
      bucket.count += 1;
      buckets.set(song.folderId, bucket);
    }
    const averages = new Map<string, number>();
    buckets.forEach((bucket, id) => {
      averages.set(id, Math.round(bucket.sum / bucket.count));
    });
    return averages;
  }, [songsQuery.data?.songs]);

  const isCompact = density === "compact";

  return (
    <div
      ref={containerRef}
      data-tour="explorer-canvas"
      onMouseDown={handleWorkspaceMouseDown}
      onContextMenu={handleCanvasContextMenu}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex-1 p-6 overflow-y-auto bg-m3-bg dark:bg-m3-bg relative transition-all select-none min-h-75 h-full ${
        isDraggingOver
          ? "ring-4 ring-inset ring-m3-primary bg-m3-primary/5"
          : ""
      }`}
    >
      {/* Drag Over Overlay (só para upload externo, nunca durante drag interno) */}
      {isDraggingOver && !isInternalDragActive && (
        <Can permission="song.import">
          <div className="absolute inset-0 bg-m3-primary/10 backdrop-blur-xs z-30 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
            <div className="w-16 h-16 rounded-3xl bg-m3-primary text-white flex items-center justify-center shadow-lg mb-3 animate-bounce">
              <Upload className="w-8 h-8" />
            </div>
            <h3 className="text-title text-m3-primary">
              {t("foldersPage.dropHere")}
            </h3>
            <p className="text-caption mt-1">
              {t("foldersPage.dropHereDesc", {
                folder: currentFolder
                  ? currentFolder.name
                  : t("layout.rootDirectory"),
              })}
            </p>
          </div>
        </Can>
      )}

      {foldersQuery.isLoading || songsQuery.isLoading ? (
        <div className="h-full flex items-center justify-center p-12">
          <Spinner label={t("foldersPage.loading")} />
        </div>
      ) : totalItemsCount === 0 ? (
        <div className="h-full flex flex-col items-center justify-center">
          <EmptyState
            icon={<FolderOpen className="w-8 h-8" />}
            title={
              searchQuery
                ? t("foldersPage.noResults")
                : t("foldersPage.emptyTitle")
            }
            description={
              searchQuery
                ? t("foldersPage.noResultsDesc", {
                    folder: currentFolder
                      ? currentFolder.name
                      : t("common.root"),
                    query: searchQuery,
                  })
                : currentFolderId === null
                  ? t("foldersPage.emptyRootDesc")
                  : t("foldersPage.emptyFolderDesc", {
                      folder: currentFolder?.name || "",
                    })
            }
            actionLabel={
              !searchQuery && canCreateSong
                ? t("addressBar.newSong")
                : undefined
            }
            onAction={
              !searchQuery && canCreateSong
                ? () => setIsCreateSongModalOpen(true)
                : undefined
            }
          />
          {!searchQuery && (
            <div className="flex flex-col items-center gap-3 -mt-2 mb-8">
              <CanAll permissions={["song.create", "song.import"]}>
                <span className="text-label">{t("common.or")}</span>
              </CanAll>
              <Can permission="song.import">
                <button
                  type="button"
                  onClick={() => fileInputRef?.current?.click()}
                  className="text-sm font-medium text-m3-primary hover:underline flex items-center gap-1.5 cursor-pointer bg-m3-primary/10 px-4 py-2 rounded-[var(--radius-md)] border border-m3-primary/25 hover:bg-m3-primary/15 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{t("foldersPage.dragOrClick")}</span>
                </button>
              </Can>
            </div>
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div
          className={
            isCompact
              ? "grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3.5"
              : "grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
          }
        >
          {filteredSubfolders.map((folder) => (
            <FolderGridCard
              key={folder.id}
              folder={folder}
              isSelected={selectedFolderIds.has(folder.id)}
              isSearchingOrFiltering={isSearchingOrFiltering}
              isDropTarget={dropTargetFolderId === folder.id}
              isDropDisabled={dragDisabledFolderIds.has(folder.id)}
              isInternalDragActive={isInternalDragActive}
              getFolderPathString={getFolderPathString}
              density={density}
              onClick={(e) => handleItemClick(e, folder.id, "folder")}
              onDoubleClick={() => handleSelectFolder(folder.id)}
              onContextMenu={(e) => handleContextMenu(e, "folder", folder)}
              onDragStart={(e) => handleItemDragStart(e, folder.id, "folder")}
              onDragEnd={handleItemDragEnd}
              onDragOver={(e) => handleFolderDragOver(e, folder.id)}
              onDragLeave={(e) => handleFolderDragLeave(e, folder.id)}
              onDrop={(e) => handleFolderDrop(e, folder.id)}
            />
          ))}

          {filteredFiles.map((song) => (
            <SongGridCard
              key={song.id}
              song={song}
              isSelected={selectedSongIds.has(song.id)}
              isSearchingOrFiltering={isSearchingOrFiltering}
              getFolderPathString={getFolderPathString}
              density={density}
              showSongScore={showSongScore}
              songScoreLayout={personalSettings.songScoreLayout}
              onClick={(e) => handleItemClick(e, song.id, "song")}
              onDoubleClick={() => navigate(`${slugPrefix}/songs/${song.id}`)}
              onContextMenu={(e) => handleContextMenu(e, "song", song)}
              onDragStart={(e) => handleItemDragStart(e, song.id, "song")}
              onDragEnd={handleItemDragEnd}
            />
          ))}
        </div>
      ) : (
        <div className="bg-m3-card border border-m3-border rounded-3xl shadow-sm overflow-hidden flex flex-col transition-all">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse select-none">
              <thead>
                <tr className="bg-m3-sidebar/40 border-b border-m3-border">
                  <th
                    className={`text-label ${isCompact ? "py-2.5 px-4" : "py-3.5 px-6"}`}
                  >
                    {t("common.name")}
                  </th>
                  <th
                    className={`text-label ${isCompact ? "py-2.5 px-4" : "py-3.5 px-6"}`}
                  >
                    {t("common.type")}
                  </th>
                  {isSearchingOrFiltering && (
                    <th
                      className={`text-label ${isCompact ? "py-2.5 px-4" : "py-3.5 px-6"}`}
                    >
                      {t("common.location")}
                    </th>
                  )}
                  <th
                    className={`text-label ${isCompact ? "py-2.5 px-4" : "py-3.5 px-6"}`}
                  >
                    {t("common.details")}
                  </th>
                  {showSongScore && (
                    <th
                      className={`text-label ${isCompact ? "py-2.5 px-4" : "py-3.5 px-6"}`}
                    >
                      {t("common.score")}
                    </th>
                  )}
                  <th
                    className={`text-label ${isCompact ? "py-2.5 px-4" : "py-3.5 px-6"} text-right`}
                  >
                    {t("common.action")}
                  </th>
                </tr>
              </thead>
              <tbody
                className={`divide-y divide-m3-border/30 ${isCompact ? "text-xs" : "text-[13px]"} font-bold`}
              >
                {filteredSubfolders.map((folder) => (
                  <FolderTableRow
                    key={folder.id}
                    folder={folder}
                    isSelected={selectedFolderIds.has(folder.id)}
                    isSearchingOrFiltering={isSearchingOrFiltering}
                    isDropTarget={dropTargetFolderId === folder.id}
                    isDropDisabled={dragDisabledFolderIds.has(folder.id)}
                    isInternalDragActive={isInternalDragActive}
                    getFolderPathString={getFolderPathString}
                    density={density}
                    onClick={(e) => handleItemClick(e, folder.id, "folder")}
                    onDoubleClick={() => handleSelectFolder(folder.id)}
                    onContextMenu={(e) =>
                      handleContextMenu(e, "folder", folder)
                    }
                    onDragStart={(e) =>
                      handleItemDragStart(e, folder.id, "folder")
                    }
                    onDragEnd={handleItemDragEnd}
                    onDragOver={(e) => handleFolderDragOver(e, folder.id)}
                    onDragLeave={(e) => handleFolderDragLeave(e, folder.id)}
                    onDrop={(e) => handleFolderDrop(e, folder.id)}
                    showSongScore={showSongScore}
                    averageScore={folderAverageScores.get(folder.id) ?? null}
                    songScoreLayout={personalSettings.songScoreLayout}
                  />
                ))}

                {filteredFiles.map((song) => (
                  <SongTableRow
                    key={song.id}
                    song={song}
                    isSelected={selectedSongIds.has(song.id)}
                    isSearchingOrFiltering={isSearchingOrFiltering}
                    getFolderPathString={getFolderPathString}
                    density={density}
                    showSongScore={showSongScore}
                    songScoreLayout={personalSettings.songScoreLayout}
                    onClick={(e) => handleItemClick(e, song.id, "song")}
                    onDoubleClick={() =>
                      navigate(`${slugPrefix}/songs/${song.id}`)
                    }
                    onContextMenu={(e) => handleContextMenu(e, "song", song)}
                    onDragStart={(e) => handleItemDragStart(e, song.id, "song")}
                    onDragEnd={handleItemDragEnd}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
