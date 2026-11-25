// SPDX-License-Identifier: AGPL-3.0-only
import {
  HOSANNA_EXPORT_CURRENT_VERSION,
  HOSANNA_EXPORT_FORMAT,
  type HosannaExportCollection,
  type HosannaExportDocument,
  type HosannaExportFolder,
  type HosannaExportSong,
} from "@hosanna/types";
import type { HosanaDatabase } from "@/src/db";

export interface ExportableFolder {
  id: string;
  name: string;
  parentId?: string | null;
  color?: string;
  icon?: string;
  deleted?: boolean;
  isDeleted?: boolean;
  _deleted?: boolean;
}

export interface ExportableSong {
  id: string;
  title: string;
  artist: string;
  folderId?: string | null;
  tags?: string[];
  content: string;
  song_number?: number | null;
  updatedAt?: string;
  deleted?: boolean;
  isDeleted?: boolean;
  _deleted?: boolean;
}

export interface ExportableCollection {
  id: string;
  name: string;
  description?: string | null;
  color?: string;
  icon?: string;
  songIds?: string[];
  deleted?: boolean;
  isDeleted?: boolean;
  _deleted?: boolean;
}

export interface BuildHosannaExportInput {
  orgId?: string | null;
  selectedFolderIds?: Iterable<string>;
  selectedSongIds?: Iterable<string>;
  selectedCollectionIds?: Iterable<string>;
  folders: readonly ExportableFolder[];
  songs: readonly ExportableSong[];
  collections: readonly ExportableCollection[];
  exportedAt?: string;
}

function isActive(item: { deleted?: boolean; isDeleted?: boolean; _deleted?: boolean }): boolean {
  return !item.deleted && !item.isDeleted && !item._deleted;
}

export function buildHosannaExportDocument(
  input: BuildHosannaExportInput,
): HosannaExportDocument {
  const activeFolders = input.folders.filter(isActive);
  const activeSongs = input.songs.filter(isActive);
  const activeCollections = input.collections.filter(isActive);

  const folderById = new Map<string, ExportableFolder>();
  const childrenByParent = new Map<string, ExportableFolder[]>();
  for (const folder of activeFolders) {
    folderById.set(folder.id, folder);
    if (folder.parentId) {
      const siblings = childrenByParent.get(folder.parentId);
      if (siblings) siblings.push(folder);
      else childrenByParent.set(folder.parentId, [folder]);
    }
  }

  const collectedFolderIds = new Set<string>();
  const queue: string[] = [];
  for (const id of input.selectedFolderIds ?? []) {
    if (folderById.has(id) && !collectedFolderIds.has(id)) {
      collectedFolderIds.add(id);
      queue.push(id);
    }
  }

  while (queue.length > 0) {
    const parentId = queue.shift()!;
    const children = childrenByParent.get(parentId) ?? [];
    for (const child of children) {
      if (!collectedFolderIds.has(child.id)) {
        collectedFolderIds.add(child.id);
        queue.push(child.id);
      }
    }
  }

  const exportedFolders: HosannaExportFolder[] = [];
  for (const id of collectedFolderIds) {
    const folder = folderById.get(id)!;
    const parentId =
      folder.parentId && collectedFolderIds.has(folder.parentId) ? folder.parentId : null;
    exportedFolders.push({
      id: folder.id,
      name: folder.name,
      parentId,
      ...(folder.color ? { color: folder.color } : {}),
      ...(folder.icon ? { icon: folder.icon } : {}),
    });
  }

  const songById = new Map<string, ExportableSong>();
  for (const song of activeSongs) {
    songById.set(song.id, song);
  }

  const collectedSongs = new Map<string, ExportableSong>();
  const addSong = (song: ExportableSong | undefined) => {
    if (song && !collectedSongs.has(song.id)) {
      collectedSongs.set(song.id, song);
    }
  };

  for (const id of input.selectedSongIds ?? []) {
    addSong(songById.get(id));
  }

  for (const song of activeSongs) {
    if (song.folderId && collectedFolderIds.has(song.folderId)) {
      addSong(song);
    }
  }

  const collectionById = new Map<string, ExportableCollection>();
  for (const collection of activeCollections) {
    collectionById.set(collection.id, collection);
  }

  const exportedCollections: HosannaExportCollection[] = [];
  const seenCollectionIds = new Set<string>();
  for (const id of input.selectedCollectionIds ?? []) {
    if (seenCollectionIds.has(id)) continue;
    const collection = collectionById.get(id);
    if (!collection) continue;
    seenCollectionIds.add(id);

    const validSongIds: string[] = [];
    const seenSongIds = new Set<string>();
    for (const songId of collection.songIds ?? []) {
      if (seenSongIds.has(songId)) continue;
      const song = songById.get(songId);
      if (!song) continue;
      seenSongIds.add(songId);
      addSong(song);
      validSongIds.push(songId);
    }

    exportedCollections.push({
      id: collection.id,
      name: collection.name,
      ...(collection.description != null ? { description: collection.description } : {}),
      ...(collection.color ? { color: collection.color } : {}),
      ...(collection.icon ? { icon: collection.icon } : {}),
      songIds: validSongIds,
    });
  }

  const exportedSongs: HosannaExportSong[] = Array.from(collectedSongs.values()).map((song) => ({
    id: song.id,
    title: song.title,
    artist: song.artist ?? "",
    folderId: song.folderId && collectedFolderIds.has(song.folderId) ? song.folderId : null,
    tags: Array.isArray(song.tags) ? [...song.tags] : [],
    content: song.content ?? "",
    ...(song.song_number != null ? { song_number: song.song_number } : {}),
    ...(song.updatedAt ? { updatedAt: song.updatedAt } : {}),
  }));

  return {
    format: HOSANNA_EXPORT_FORMAT,
    version: HOSANNA_EXPORT_CURRENT_VERSION,
    exportedAt: input.exportedAt ?? new Date().toISOString(),
    source: {
      ...(input.orgId ? { orgId: input.orgId } : {}),
      app: "studio",
    },
    folders: exportedFolders,
    songs: exportedSongs,
    collections: exportedCollections,
  };
}

export function exportSelectionFromDatabase(
  db: HosanaDatabase,
  selection: {
    selectedFolderIds?: Iterable<string>;
    selectedSongIds?: Iterable<string>;
    selectedCollectionIds?: Iterable<string>;
    orgId?: string | null;
  },
): HosannaExportDocument {
  return buildHosannaExportDocument({
    orgId: selection.orgId,
    selectedFolderIds: selection.selectedFolderIds,
    selectedSongIds: selection.selectedSongIds,
    selectedCollectionIds: selection.selectedCollectionIds,
    folders: db.folders.getAllRaw(),
    songs: db.songs.getAllRaw(),
    collections: db.collections.getAllRaw(),
  });
}

export function formatExportFilename(date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `hosanna-export-${yyyy}-${mm}-${dd}.json`;
}

export function downloadHosannaExport(
  doc: HosannaExportDocument,
  filename = formatExportFilename(),
): void {
  const json = JSON.stringify(doc, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
