/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Song } from "@/src/types";
import { readFileTextWithProgress } from "./readFile";
import type { ProviderImportResult, SongImportContext, SongImportProvider } from "./types";

export class ChordProImportProvider implements SongImportProvider {
  readonly id = "chordpro";
  readonly name = "ChordPro Importer";
  readonly fileTypeName = "ChordPro";
  readonly description = "Imports Simple Chordpro Files";
  readonly supportedExtensions = [".cho", ".chopro", ".pro", ".crd", ".txt"];

  cleanSongTitleFromFilename(filename: string): string {
    let name = filename.replace(/\.[^/.]+$/, "");
    name = name.replace(/\[.*?\]/g, "");
    name = name.replace(/\(.*?\)/g, "");
    name = name.replace(/\{.*?\}/g, "");
    name = name.replace(/#\w+/g, "");
    name = name.replace(/_/g, " ");
    name = name.replace(/\s+/g, " ").trim();
    return name || filename.replace(/\.[^/.]+$/, "").trim();
  }

  async import(files: File[], ctx: SongImportContext): Promise<ProviderImportResult> {
    const songPayloads: Array<Partial<Song> & { title: string }> = [];
    const totalFiles = Math.max(1, files.length);

    for (let i = 0; i < files.length; i++) {
      const file = files[i]!;
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

      const cleanTitle = this.cleanSongTitleFromFilename(file.name);
      let finalContent = fileText;
      if (!/\{title\s*:/i.test(fileText)) {
        finalContent = `{title: ${cleanTitle}}\n${fileText}`;
      }

      let artist = "Vários";
      const artistMatch = fileText.match(/\{artist\s*:\s*([^}]+)\}/i);
      if (artistMatch?.[1]) artist = artistMatch[1].trim();

      songPayloads.push({
        title: cleanTitle,
        artist,
        content: finalContent,
        tags: ["ChordPro"],
        ...ctx.songData,
      });

      ctx.onProgress?.({
        phase: "processing",
        done: i + 1,
        total: totalFiles,
        label: file.name,
      });
    }

    if (songPayloads.length === 0) {
      return {
        providerId: this.id,
        fileTypeName: this.fileTypeName,
        created: 0,
        failed: 0,
        ignored: files.length,
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
        ignored: 0,
      };
    } catch {
      return {
        providerId: this.id,
        fileTypeName: this.fileTypeName,
        created: 0,
        failed: songPayloads.length,
        ignored: 0,
      };
    }
  }
}
