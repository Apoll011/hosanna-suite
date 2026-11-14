/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ComponentType } from "react";
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

export type ImportTranslate = (
  key: string,
  params?: Record<string, string | number>,
) => string;

export interface InteractiveImportModalProps<TSession = unknown, TConfirm = unknown> {
  isOpen: boolean;
  session: TSession;
  isImporting: boolean;
  progress: { done: number; total: number } | null;
  onClose: () => void;
  onConfirm: (options: TConfirm) => void | Promise<void>;
}

export interface InteractiveImportToastCopy {
  title: string;
  description: string;
}

export interface SongImportProvider {
  readonly id: string;
  readonly name: string;
  readonly fileTypeName: string;
  readonly description?: string;

  readonly supportedExtensions: readonly string[];

  readonly interactive?: boolean;

  import(files: readonly File[], ctx: SongImportContext): Promise<ProviderImportResult>;

  matchesFile?(file: File): boolean | Promise<boolean>;

  prepare?(files: readonly File[], onProgress?: ImportProgressCallback): Promise<unknown>;

  commit?(
    session: unknown,
    options: unknown,
    ctx: SongImportContext,
  ): Promise<ProviderImportResult>;

  Modal?: ComponentType<InteractiveImportModalProps<any, any>>;

  getPrepareProgressTitle?(t: ImportTranslate): string;
  getPreparedToast?(session: unknown, t: ImportTranslate): InteractiveImportToastCopy | null;
  getCommitProgressTitle?(t: ImportTranslate): string;
  getSuccessMessage?(result: ProviderImportResult, t: ImportTranslate): string | null;
  getErrorMessage?(error: unknown, t: ImportTranslate): string;
}

export function isInteractiveImportProvider(
  provider: SongImportProvider,
): provider is SongImportProvider & {
  interactive: true;
  prepare: NonNullable<SongImportProvider["prepare"]>;
  commit: NonNullable<SongImportProvider["commit"]>;
  Modal: NonNullable<SongImportProvider["Modal"]>;
} {
  return Boolean(
    provider.interactive && provider.prepare && provider.commit && provider.Modal,
  );
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
