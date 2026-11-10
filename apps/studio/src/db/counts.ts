/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Derived local-only counts for folders / collections.
 * Recalculated after sync (and on open) so server-provided zeros never stick.
 */

import type { HosanaCollection } from "@hosanna/replication";
import type { HosanaDatabase } from "./database";
import type { CollectionDocType, FolderDocType, SongDocType } from "./schemas";

type AsSongDoc = SongDocType & Record<string, unknown>;
type AsFolderDoc = FolderDocType & Record<string, unknown>;
type AsCollectionDoc = CollectionDocType & Record<string, unknown>;

/**
 * Calculates the number of non-deleted songs belonging to a given folder.
 */
export function calculateFolderSongCount(
  folderId: string,
  songs:
    | Array<Pick<SongDocType, "folderId" | "isDeleted" | "_deleted">>
    | HosanaCollection<AsSongDoc>,
): number {
  const list = Array.isArray(songs) ? songs : songs.getAllRaw();
  return list.filter((s) => s.folderId === folderId && !s.isDeleted && !s._deleted).length;
}

/**
 * Calculates the number of non-deleted subfolders belonging to a given parent folder.
 */
export function calculateFolderCount(
  folderId: string,
  folders:
    | Array<Pick<FolderDocType, "parentId" | "isDeleted" | "_deleted">>
    | HosanaCollection<AsFolderDoc>,
): number {
  const list = Array.isArray(folders) ? folders : folders.getAllRaw();
  return list.filter((f) => f.parentId === folderId && !f.isDeleted && !f._deleted).length;
}

/**
 * Recalculates songCount and folderCount for an array of folders using the given songs.
 */
export function recalculateFolderCounts(
  folders: AsFolderDoc[],
  songs: Array<Pick<SongDocType, "folderId" | "isDeleted">>,
): AsFolderDoc[] {
  return folders.map((folder) => ({
    ...folder,
    songCount: calculateFolderSongCount(folder.id, songs),
    folderCount: calculateFolderCount(folder.id, folders),
  }));
}

/**
 * Recalculates and updates songCount and folderCount for a specific folder.
 * Uses applyLocalFields so count-only writes do not schedule a push.
 */
export async function updateFolderCounts(db: HosanaDatabase, folderId: string): Promise<void> {
  const folder = db.folders.getRaw(folderId);
  if (!folder) return;
  await db.folders.applyLocalFields(folderId, {
    songCount: calculateFolderSongCount(folderId, db.songs),
    folderCount: calculateFolderCount(folderId, db.folders),
  });
}

/**
 * Calculates the number of non-deleted songs belonging to a given collection.
 */
export function calculateCollectionSongCount(
  collectionId: string,
  songs:
    | Array<Pick<SongDocType, "id" | "collectionIds" | "isDeleted" | "_deleted">>
    | HosanaCollection<AsSongDoc>,
): number {
  const list = Array.isArray(songs) ? songs : songs.getAllRaw();
  return list.filter(
    (s) =>
      Array.isArray(s.collectionIds) &&
      s.collectionIds.includes(collectionId) &&
      !s.isDeleted &&
      !s._deleted,
  ).length;
}

/**
 * Recalculates songCount and synchronizes songIds for an array of collections using the given songs.
 */
export function recalculateCollectionCounts(
  collections: AsCollectionDoc[],
  songs: Array<Pick<SongDocType, "id" | "collectionIds" | "isDeleted" | "_deleted">>,
): AsCollectionDoc[] {
  const activeSongs = songs.filter((s) => !s.isDeleted && !s._deleted);
  const activeSongIdSet = new Set(activeSongs.map((s) => s.id));

  return collections.map((collection) => {
    const songIdsSet = new Set<string>();
    for (const s of activeSongs) {
      if (Array.isArray(s.collectionIds) && s.collectionIds.includes(collection.id)) {
        songIdsSet.add(s.id);
      }
    }
    if (Array.isArray(collection.songIds)) {
      for (const sid of collection.songIds) {
        if (activeSongIdSet.has(sid)) {
          songIdsSet.add(sid);
        }
      }
    }
    const syncedSongIds = Array.from(songIdsSet);
    return {
      ...collection,
      songIds: syncedSongIds,
      songCount: syncedSongIds.length,
    };
  });
}

/**
 * Recalculates and updates songCount and songIds for a specific collection.
 * Uses patch so songIds changes still replicate to the server.
 */
export async function updateCollectionCounts(
  db: HosanaDatabase,
  collectionId: string,
): Promise<void> {
  const collection = await db.collections.findOne(collectionId).exec();
  if (!collection) return;

  const allSongs = db.songs.getAllRaw();
  const activeSongs = allSongs.filter((s) => !s.isDeleted && !s._deleted);
  const activeSongIdSet = new Set(activeSongs.map((s) => s.id));

  const songIdsSet = new Set<string>();
  for (const s of activeSongs) {
    if (Array.isArray(s.collectionIds) && s.collectionIds.includes(collectionId)) {
      songIdsSet.add(s.id);
    }
  }
  if (Array.isArray(collection.songIds)) {
    for (const sid of collection.songIds) {
      if (activeSongIdSet.has(sid)) {
        songIdsSet.add(sid);
      }
    }
  }

  const syncedSongIds = Array.from(songIdsSet);
  await collection.patch({
    songIds: syncedSongIds,
    songCount: syncedSongIds.length,
  });
}

/**
 * Recompute all derived folder/collection counts from current song membership
 * and write them as local-only fields (no push). Call after every successful
 * sync cycle — especially post org-switch full pull when the server returns 0.
 */
export async function recalculateAllDerivedCounts(db: HosanaDatabase): Promise<void> {
  const songs = db.songs.getAllRaw();
  const folders = db.folders.getAllRaw();
  const collections = db.collections.getAllRaw();

  const nextFolders = recalculateFolderCounts(folders, songs);
  await db.folders.applyLocalFieldsBatch(
    nextFolders.map((f) => ({
      id: f.id,
      fields: { songCount: f.songCount, folderCount: f.folderCount },
    })),
  );

  const nextCollections = recalculateCollectionCounts(collections, songs);
  await db.collections.applyLocalFieldsBatch(
    nextCollections.map((c) => ({
      id: c.id,
      fields: { songCount: c.songCount, songIds: c.songIds },
    })),
  );
}
