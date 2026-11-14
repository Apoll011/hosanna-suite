/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ImportSink } from "../sink";
import type { ImportProgressCallback, ProviderImportResult } from "../types";
import { yieldToUi } from "../readFile";
import { buildSongbookImportPlan } from "./plan";
import type { SongbookBackupDocument, SongbookImportOptions } from "./types";

export interface ExecuteSongbookImportOptions extends SongbookImportOptions {
  onProgress?: ImportProgressCallback;
}

export async function executeSongbookImport(
  doc: SongbookBackupDocument,
  options: ExecuteSongbookImportOptions,
  sink: ImportSink,
): Promise<ProviderImportResult> {
  options.onProgress?.({ phase: "processing", done: 0, total: Math.max(1, doc.songs.length) });
  await yieldToUi();

  const plan = buildSongbookImportPlan(doc, options);
  if (plan.songs.length === 0) {
    return {
      providerId: "songbook-pro",
      fileTypeName: "SongbookPro",
      created: 0,
      failed: 0,
      ignored: plan.skipped,
    };
  }

  options.onProgress?.({
    phase: "processing",
    done: plan.songs.length,
    total: Math.max(plan.songs.length, doc.songs.length),
  });

  const folderIds = await sink.ensureFolders(plan.folders);
  const collectionIds = await sink.ensureCollections(plan.collections);

  const payloads = plan.songs.map((song) => ({
    title: song.title,
    artist: song.artist,
    content: song.content,
    tags: song.tags,
    song_number: song.song_number,
    path: song.path,
    folderId: song.folderKey ? (folderIds.get(song.folderKey) ?? null) : null,
    collectionIds: song.collectionKeys
      .map((key) => collectionIds.get(key))
      .filter((id): id is string => Boolean(id)),
    createdAt: song.createdAt,
  }));

  const result = await sink.createSongsBatch(payloads, {
    onPrepareProgress: (done, total) =>
      options.onProgress?.({ phase: "processing", done, total }),
    onProgress: (done, total) => options.onProgress?.({ phase: "writing", done, total }),
  });

  return {
    providerId: "songbook-pro",
    fileTypeName: "SongbookPro",
    created: result.created.length,
    failed: result.failed,
    ignored: plan.skipped,
  };
}
