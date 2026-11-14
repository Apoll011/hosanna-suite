/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Song } from "@/src/types";
import type { ImportSink } from "./sink";

export interface SongImportProvider {
  readonly id: string;
  readonly name: string;
  readonly fileTypeName: string;
  readonly description?: string;

  readonly supportedExtensions: readonly string[];

  readonly interactive?: boolean;

  import(files: readonly File[], songData: Partial<Song>): Promise<ProviderImportResult>;

  prepare?(files: readonly File[]): Promise<unknown>;

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
