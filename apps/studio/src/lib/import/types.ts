/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Song } from "@/src/types";
import type { ImportSink } from "./sink";

export type ImportProgressPhase = "reading" | "processing" | "writing";

export interface ImportProgressEvent {
  phase: ImportProgressPhase;
  done: number;
  total: number;
  label?: string;
}

export type ImportProgressCallback = (event: ImportProgressEvent) => void;

export interface SongImportContext {
  songData: Partial<Song>;
  sink: ImportSink;
  onProgress?: ImportProgressCallback;
}

export interface SongImportProvider {
  readonly id: string;
  readonly name: string;
  readonly fileTypeName: string;
  readonly description?: string;

  readonly supportedExtensions: readonly string[];

  readonly interactive?: boolean;

  import(files: readonly File[], ctx: SongImportContext): Promise<ProviderImportResult>;

  prepare?(files: readonly File[], onProgress?: ImportProgressCallback): Promise<unknown>;

  importWithSink?(
    files: readonly File[],
    songData: Partial<Song>,
    sink: ImportSink,
  ): Promise<ProviderImportResult>;
}

export interface ImportResult {
  success: boolean;
  results: ProviderImportResult[];
}

export interface ProviderImportResult {
  providerId: string;
  fileTypeName: string;

  created: number;
  failed: number;
  ignored: number;
}

export interface ProvidersMetadata {
  id: string;
  name: string;
  description?: string;
  supportedExtensions: readonly string[];
  interactive?: boolean;
}
