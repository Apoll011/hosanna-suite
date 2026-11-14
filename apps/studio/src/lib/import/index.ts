/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChordProImportProvider } from "./chordpro";
import { JsonImportProvider } from "./json";
import { SongImportRegistry } from "./registry";
import { SongbookProImportProvider } from "./songbookProvider";

export type { ImportResult, ProviderImportResult, SongImportProvider } from "./types";
export type { ImportSink } from "./sink";
export { createLocalImportSink, createLocalImportSink as createDefaultImportSink } from "./sink";
export {
  detectSongbookBackupFile,
  looksLikeSongbookBackupFile,
  parseSongbookBackupFile,
  summarizeSongbookSetlists,
  type SongbookBackupDocument,
  type SongbookImportOptions,
  type SongbookPlacementMode,
  type SongbookSetlistSummary,
} from "./songbook";
export { SongbookProImportProvider } from "./songbookProvider";

export const songImportRegistry = new SongImportRegistry();

songImportRegistry.register(new ChordProImportProvider());
songImportRegistry.register(new JsonImportProvider());
songImportRegistry.register(new SongbookProImportProvider());

export function getSongbookProProvider(): SongbookProImportProvider {
  const provider = songImportRegistry.getProviderById("songbook-pro");
  if (!provider || !(provider instanceof SongbookProImportProvider)) {
    throw new Error("SongbookPro import provider is not registered.");
  }
  return provider;
}
