/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Song } from "@/src/types";
import {
  getDatabase,
  recalculateAllDerivedCounts,
  validateBatchSongs,
  type HosanaDatabase,
} from "@/src/db";
import { yieldToUi } from "./readFile";

export interface ImportFolderInput {
  key: string;
  name: string;
  parentId?: string | null;
}

export interface ImportCollectionInput {
  key: string;
  name: string;
  description?: string | null;
}

export interface ImportSongsBatchOptions {
  chunkSize?: number;
  onProgress?: (done: number, total: number) => void;
  onPrepareProgress?: (done: number, total: number) => void;
}

export interface ImportSink {
  ensureFolders(inputs: ImportFolderInput[]): Promise<Map<string, string>>;
  ensureCollections(inputs: ImportCollectionInput[]): Promise<Map<string, string>>;
  createSongsBatch(
    songs: Array<Partial<Song> & { title: string }>,
    options?: ImportSongsBatchOptions,
  ): Promise<{ created: Song[]; failed: number }>;
}

function adaptiveChunkSize(count: number): number {
  if (count >= 2000) return 75;
  if (count >= 800) return 100;
  if (count >= 300) return 150;
  return 200;
}

export function createLocalImportSink(dbPromise: Promise<HosanaDatabase> = getDatabase()): ImportSink {
  return {
    async ensureFolders(inputs) {
      const db = await dbPromise;
      const map = new Map<string, string>();
      if (inputs.length === 0) return map;

      const now = new Date().toISOString();
      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i]!;
        const id = crypto.randomUUID();
        await db.folders.insert({
          id,
          name: input.name.trim(),
          parentId: input.parentId ?? null,
          songCount: 0,
          folderCount: 0,
          createdAt: now,
          updatedAt: now,
          _deleted: false,
        });
        map.set(input.key, id);
        if ((i + 1) % 25 === 0) await yieldToUi();
      }
      return map;
    },

    async ensureCollections(inputs) {
      const db = await dbPromise;
      const map = new Map<string, string>();
      if (inputs.length === 0) return map;

      const now = new Date().toISOString();
      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i]!;
        const id = crypto.randomUUID();
        await db.collections.insert({
          id,
          name: input.name.trim(),
          description: input.description ?? null,
          color: "default",
          icon: "music",
          image: null,
          songCount: 0,
          songIds: [],
          createdAt: now,
          updatedAt: now,
          _deleted: false,
        });
        map.set(input.key, id);
        if ((i + 1) % 25 === 0) await yieldToUi();
      }
      return map;
    },

    async createSongsBatch(songs, options = {}) {
      const db = await dbPromise;
      if (songs.length === 0) return { created: [], failed: 0 };

      const chunkSize = Math.max(
        1,
        options.chunkSize ?? adaptiveChunkSize(songs.length),
      );
      const prepared = await validateBatchSongs(db, songs, {
        onProgress: options.onPrepareProgress,
      });
      const created: Song[] = [];
      let failed = 0;

      for (let i = 0; i < prepared.length; i += chunkSize) {
        const chunk = prepared.slice(i, i + chunkSize);
        const result = await db.songs.bulkInsert(
          chunk as unknown as Parameters<typeof db.songs.bulkInsert>[0],
        );
        created.push(...result.success.map((doc) => doc.toJSON() as Song));
        failed += result.error.length;
        options.onProgress?.(Math.min(i + chunk.length, prepared.length), prepared.length);
        await yieldToUi();
      }

      await recalculateAllDerivedCounts(db);
      return { created, failed };
    },
  };
}
