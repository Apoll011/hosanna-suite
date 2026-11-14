/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChordProImportProvider } from "./chordpro";
import { JsonImportProvider } from "./json";
import { SongImportRegistry } from "./registry";
import { SongbookProImportProvider } from "./songbookProvider";

export type {
  ImportProgressCallback,
  ImportProgressEvent,
  ImportProgressPhase,
  ImportResult,
  ImportTranslate,
  InteractiveImportModalProps,
  InteractiveImportToastCopy,
  ProviderImportResult,
  SongImportContext,
  SongImportProvider,
} from "./types";
export { isInteractiveImportProvider } from "./types";
export type { ImportSink } from "./sink";
export { createLocalImportSink, createLocalImportSink as createDefaultImportSink } from "./sink";
export { describeImportProgress } from "./progressCopy";
export { readFileTextWithProgress, yieldToUi } from "./readFile";
export {
  detectSongbookBackupFile,
  looksLikeSongbookBackupFile,
  parseSongbookBackupFile,
  summarizeSongbookSetlists,
  type SongbookBackupDocument,
  type SongbookImportOptions,
  type SongbookSetlistSummary,
} from "./songbook";
export { SongbookProImportProvider } from "./songbookProvider";

export const songImportRegistry = new SongImportRegistry();

songImportRegistry.register(new ChordProImportProvider());
songImportRegistry.register(new JsonImportProvider());
songImportRegistry.register(new SongbookProImportProvider());
