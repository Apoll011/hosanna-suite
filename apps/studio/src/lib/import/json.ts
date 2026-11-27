/**
 * @license
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { HOSANNA_EXPORT_MAX_BYTES, parseHosannaExportJson } from "@hosanna/types";
import { executeHosannaImport } from "./hosannaExport";
import { readFileTextWithProgress } from "./readFile";
import type { ProviderImportResult, SongImportContext, SongImportProvider } from "./types";

export class JsonImportProvider implements SongImportProvider {
  readonly id = "json";
  readonly name = "JSON Importer";
  readonly fileTypeName = "JSON";
  readonly description = "Imports Hosanna export files";
  readonly supportedExtensions = [".json"];

  async import(files: File[], ctx: SongImportContext): Promise<ProviderImportResult> {
    let created = 0;
    let failed = 0;
    let ignored = 0;
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

        if (file.size > HOSANNA_EXPORT_MAX_BYTES) {
          ignored++;
          continue;
        }

        const parsed = parseHosannaExportJson(fileText, file.size);
        if (!("data" in parsed)) {
          ignored++;
          continue;
        }

        const result = await executeHosannaImport(ctx.db, parsed.data, {
          targetFolderId: ctx.songData.folderId,
          permissions: ctx.permissions,
        });
        created +=
          result.foldersCreated +
          result.songsCreated +
          result.songsOverwritten +
          result.collectionsCreated;
        ignored += result.songsSkipped;

        ctx.onProgress?.({
          phase: "processing",
          done: i + 1,
          total: totalFiles,
          label: file.name,
        });
      } catch {
        failed++;
      }
    }

    return { providerId: this.id, fileTypeName: this.fileTypeName, created, failed, ignored };
  }

  isActive(): boolean {
    return true;
  }
}
