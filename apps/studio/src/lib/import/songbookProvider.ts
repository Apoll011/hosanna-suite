/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Song } from "@/src/types";
import type { ImportSink } from "./sink";
import {
  executeSongbookImport,
  parseSongbookBackupFile,
  type SongbookBackupDocument,
  type SongbookImportOptions,
} from "./songbook";
import type { ProviderImportResult, SongImportProvider } from "./types";

export class SongbookProImportProvider implements SongImportProvider {
  readonly id = "songbook-pro";
  readonly name = "SongbookPro Backup";
  readonly fileTypeName = "SongbookPro";
  readonly description =
    "Imports songs from a SongbookPro backup (.sbpbackup or dataFile.txt). Audio is skipped.";
  readonly supportedExtensions = [".sbpbackup", ".sbpbackup.json"] as const;
  readonly interactive = true;

  async prepare(files: readonly File[]): Promise<SongbookBackupDocument> {
    if (files.length === 0) {
      throw new Error("No SongbookPro backup selected.");
    }
    return parseSongbookBackupFile(files[0]!);
  }

  async import(_files: File[], _songData: Partial<Song>): Promise<ProviderImportResult> {
    return {
      providerId: this.id,
      fileTypeName: this.fileTypeName,
      created: 0,
      failed: 0,
      ignored: 0,
    };
  }

  async importPrepared(
    doc: SongbookBackupDocument,
    options: SongbookImportOptions,
    sink: ImportSink,
    onProgress?: (done: number, total: number) => void,
  ): Promise<ProviderImportResult> {
    return executeSongbookImport(doc, { ...options, onProgress }, sink);
  }
}
