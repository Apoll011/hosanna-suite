/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SongbookImportModal } from "@/src/components/modals/SongbookImportModal";
import {
  detectSongbookBackupFile,
  executeSongbookImport,
  parseSongbookBackupFile,
  type SongbookBackupDocument,
  type SongbookImportOptions,
} from "./songbook";
import type {
  ImportProgressCallback,
  ImportTranslate,
  ProviderImportResult,
  SongImportContext,
  SongImportProvider,
} from "./types";

export class SongbookProImportProvider implements SongImportProvider {
  readonly id = "songbook-pro";
  readonly name = "SongbookPro Backup";
  readonly fileTypeName = "SongbookPro";
  readonly description =
    "Imports songs from a SongbookPro backup (.sbpbackup or dataFile.txt). Audio is skipped.";
  readonly supportedExtensions = [".sbpbackup", ".sbpbackup.json"] as const;
  readonly interactive = true;
  readonly Modal = SongbookImportModal;

  matchesFile(file: File) {
    return detectSongbookBackupFile(file);
  }

  async prepare(
    files: readonly File[],
    onProgress?: ImportProgressCallback,
  ): Promise<SongbookBackupDocument> {
    if (files.length === 0) {
      throw new Error("No SongbookPro backup selected.");
    }
    return parseSongbookBackupFile(files[0]!, onProgress);
  }

  async import(_files: File[], _ctx: SongImportContext): Promise<ProviderImportResult> {
    return {
      providerId: this.id,
      fileTypeName: this.fileTypeName,
      created: 0,
      failed: 0,
      ignored: 0,
    };
  }

  async commit(
    session: unknown,
    options: unknown,
    ctx: SongImportContext,
  ): Promise<ProviderImportResult> {
    return executeSongbookImport(
      session as SongbookBackupDocument,
      {
        ...(options as SongbookImportOptions),
        onProgress: ctx.onProgress,
      },
      ctx.sink,
    );
  }

  getPrepareProgressTitle(t: ImportTranslate) {
    return t("layout.importProgressSongbookTitle");
  }

  getCommitProgressTitle(t: ImportTranslate) {
    return t("layout.importProgressSongbookTitle");
  }

  getPreparedToast(session: unknown, t: ImportTranslate) {
    const doc = session as SongbookBackupDocument;
    return {
      title: t("layout.importProgressSongbookReadyTitle"),
      description: t("layout.importProgressSongbookReadyDesc", {
        count: doc.songs.length,
      }),
    };
  }

  getSuccessMessage(result: ProviderImportResult, t: ImportTranslate) {
    return t("modals.songbookImport.success", { count: result.created });
  }

  getErrorMessage(error: unknown, t: ImportTranslate) {
    if (error instanceof Error && error.message) return error.message;
    return t("modals.songbookImport.parseError");
  }
}
