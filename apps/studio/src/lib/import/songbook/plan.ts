/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { migrateSongbookSongToChordPro, sanitizePathSegment, uniqueSongPath } from "./migrate";
import { summarizeSongbookSetlists } from "./parse";
import {
  SONGBOOK_UNFILED_ID,
  type SongbookBackupDocument,
  type SongbookImportOptions,
  type SongbookImportPlan,
  type SongbookImportPlanSong,
} from "./types";

function setlistKey(id: number): string {
  return `setlist:${id}`;
}

function setlistName(doc: SongbookBackupDocument, id: number): string {
  if (id === SONGBOOK_UNFILED_ID) return "Unfiled";
  return doc.folders.find((f) => f.id === id)?.name ?? `Setlist ${id}`;
}

export function buildSongbookImportPlan(
  doc: SongbookBackupDocument,
  options: SongbookImportOptions,
): SongbookImportPlan {
  const selected = new Set(options.selectedSetlistIds);
  if (selected.size === 0) {
    return {
      alsoCreateCollections: options.alsoCreateCollections,
      folders: [],
      collections: [],
      songs: [],
      skipped: doc.songs.length,
    };
  }

  const available = new Map(summarizeSongbookSetlists(doc).map((s) => [s.id, s]));
  const activeSelected = [...selected].filter((id) => available.has(id));
  const activeSet = new Set(activeSelected);

  const folders: SongbookImportPlan["folders"] = activeSelected.map((id) => ({
    key: setlistKey(id),
    name: setlistName(doc, id),
  }));

  const collections: SongbookImportPlan["collections"] = options.alsoCreateCollections
    ? activeSelected.map((id) => ({
        key: setlistKey(id),
        name: setlistName(doc, id),
      }))
    : [];

  const folderNameByKey = new Map(folders.map((f) => [f.key, f.name]));
  const seenPaths = new Set<string>();
  const songs: SongbookImportPlanSong[] = [];
  let skipped = 0;

  for (const song of doc.songs) {
    const membership =
      song.folderIds.length > 0 ? song.folderIds : ([SONGBOOK_UNFILED_ID] as number[]);

    const primary = membership.find((id) => activeSet.has(id));
    if (primary === undefined) {
      skipped += 1;
      continue;
    }

    const matched = options.alsoCreateCollections
      ? membership.filter((id) => activeSet.has(id))
      : [];

    const migrated = migrateSongbookSongToChordPro(song);
    const folderKey = setlistKey(primary);
    const folderName = sanitizePathSegment(
      folderNameByKey.get(folderKey) ?? setlistName(doc, primary),
    );
    const basePath = `${folderName}/${sanitizePathSegment(migrated.title)}.pro`;

    songs.push({
      title: migrated.title,
      artist: migrated.artist,
      content: migrated.content,
      tags: migrated.tags,
      song_number: migrated.song_number,
      path: uniqueSongPath(basePath, seenPaths),
      folderKey,
      collectionKeys: matched.map(setlistKey),
      createdAt: song.modifiedAt ?? undefined,
    });
  }

  return {
    alsoCreateCollections: options.alsoCreateCollections,
    folders,
    collections,
    songs,
    skipped,
  };
}
