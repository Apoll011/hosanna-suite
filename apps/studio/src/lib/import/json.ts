/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Song } from "@/src/types";
import { readFileTextWithProgress } from "./readFile";
import type { ProviderImportResult, SongImportContext, SongImportProvider } from "./types";

export class JsonImportProvider implements SongImportProvider {
  readonly id = "json";
  readonly name = "JSON Importer";
  readonly fileTypeName = "JSON";
  readonly description = "Imports songs structured in JSON format";
  readonly supportedExtensions = [".json"];

  async import(files: File[], ctx: SongImportContext): Promise<ProviderImportResult> {
    const songPayloads: Array<Partial<Song> & { title: string }> = [];
    const nameSet = new Set<string>();
    let ignoredCount = 0;
    const totalFiles = Math.max(1, files.length);

    for (let i = 0; i < files.length; i++) {
      const file = files[i]!;
      try {
        ctx.onProgress?.({
          phase: "reading",
          done: i,
          total: totalFiles,
          label: file.name,
        });

        const fileText = await readFileTextWithProgress(file, ({ bytesRead, totalBytes }) => {
          if (totalBytes <= 0) return;
          ctx.onProgress?.({
            phase: "reading",
            done: i + bytesRead / totalBytes,
            total: totalFiles,
            label: file.name,
          });
        });

        const parsedJson = JSON.parse(fileText) as unknown;

        if (typeof parsedJson === "object" && parsedJson !== null && !Array.isArray(parsedJson)) {
          for (const [key, songs] of Object.entries(parsedJson as Record<string, unknown>)) {
            if (!Array.isArray(songs)) continue;
            const targetFolderId = key === "root" ? ctx.songData.folderId : key;

            for (const item of songs as Array<Record<string, unknown>>) {
              const title = String(item.title ?? "").trim();
              if (!title || nameSet.has(title)) {
                ignoredCount++;
                continue;
              }
              songPayloads.push({
                title,
                content: String(item.content ?? ""),
                tags: Array.isArray(item.tags) ? (item.tags as string[]) : [],
                artist: String(item.artist ?? "Vários"),
                ...ctx.songData,
                folderId: (targetFolderId as string | null | undefined) ?? null,
              });
              nameSet.add(title);
            }
          }
        } else if (Array.isArray(parsedJson)) {
          for (const item of parsedJson as Array<Record<string, unknown>>) {
            const title = String(item.title ?? "").trim();
            if (!title || nameSet.has(title)) {
              ignoredCount++;
              continue;
            }
            songPayloads.push({
              title,
              content: String(item.content ?? ""),
              tags: Array.isArray(item.tags) ? (item.tags as string[]) : [],
              artist: String(item.artist ?? "Vários"),
              ...ctx.songData,
            });
            nameSet.add(title);
          }
        } else {
          ignoredCount++;
        }

        ctx.onProgress?.({
          phase: "processing",
          done: i + 1,
          total: totalFiles,
          label: file.name,
        });
      } catch {
        ignoredCount++;
      }
    }

    if (songPayloads.length === 0) {
      return {
        providerId: this.id,
        fileTypeName: this.fileTypeName,
        created: 0,
        failed: 0,
        ignored: ignoredCount || files.length,
      };
    }

    try {
      const result = await ctx.sink.createSongsBatch(songPayloads, {
        onPrepareProgress: (done, total) =>
          ctx.onProgress?.({ phase: "processing", done, total }),
        onProgress: (done, total) => ctx.onProgress?.({ phase: "writing", done, total }),
      });
      return {
        providerId: this.id,
        fileTypeName: this.fileTypeName,
        created: result.created.length,
        failed: result.failed,
        ignored: ignoredCount,
      };
    } catch {
      return {
        providerId: this.id,
        fileTypeName: this.fileTypeName,
        created: 0,
        failed: songPayloads.length,
        ignored: ignoredCount,
      };
    }
  }
}
