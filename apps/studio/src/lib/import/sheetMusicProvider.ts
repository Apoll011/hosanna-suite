/**
 * @license
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
  songsApi,
  type CreateSongImportJobInput,
  type SongImportSourceType,
} from "@/src/api/songs";
import { aiApi } from "@/src/api/ai";
import { ApiError } from "@/src/api/client";
import { SheetMusicImportModal } from "@/src/components/modals/SheetMusicImportModal";
import { Song } from "@/src/types";
import { renderImageFile, renderPdfPages } from "./pdfRenderer";
import type {
  ImportProgressCallback,
  ImportTranslate,
  ProviderImportResult,
  SongImportContext,
  SongImportProvider,
} from "./types";

export interface SheetMusicImportSession {
  jobId: string;
  fileName: string;
  sourceType: SongImportSourceType;
  previewImage: string;
  pageCount: number;
}

export interface SheetMusicImportOptions {
  title: string;
  artist: string;
  content: string;
  key?: string;
  tempo?: string;
  timeSignature?: string;
  folderId: string | null;
  tags: string[];
}

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"] as const;

export class SheetMusicImportProvider implements SongImportProvider {
  readonly id = "sheet-music-ai";
  readonly name = "Sheet Music & Chords (AI)";
  readonly fileTypeName = "Sheet Music";
  readonly description =
    "Extracts a song draft from a photo or PDF sheet using AI (lyrics, chords, key, tempo).";
  readonly supportedExtensions = [".pdf", ...IMAGE_EXTENSIONS];
  readonly interactive = true;
  readonly Modal = SheetMusicImportModal;

  matchesFile(file: File): boolean {
    const dot = file.name.lastIndexOf(".");
    const ext = dot >= 0 ? file.name.substring(dot).toLowerCase() : "";
    if (this.supportedExtensions.includes(ext)) return true;
    return file.type === "application/pdf" || file.type.startsWith("image/");
  }

  async prepare(
    files: readonly File[],
    onProgress?: ImportProgressCallback,
  ): Promise<SheetMusicImportSession> {
    const file = files[0];
    if (!file) throw new Error("No sheet music selected.");

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    let payload: CreateSongImportJobInput;
    let previewImage: string;
    let pageCount: number;
    let sourceType: SongImportSourceType;

    if (isPdf) {
      onProgress?.({ phase: "reading", done: 0, total: 1, label: file.name });
      const rendered = await renderPdfPages(file);
      onProgress?.({ phase: "reading", done: 1, total: 1, label: file.name });
      previewImage = rendered.imageBase64;
      pageCount = rendered.pageCount;
      sourceType = "pdf";
      payload = {
        sourceType,
        imageBase64: rendered.imageBase64,
        imageMimeType: "image/jpeg",
        imagesBase64: rendered.imagesBase64.slice(1),
        imageMimeTypes: rendered.mimeTypes.slice(1),
        pdfBase64: rendered.pdfBase64,
        fileName: file.name,
      };
    } else {
      const rendered = await renderImageFile(file);
      previewImage = rendered.imageBase64;
      pageCount = 1;
      sourceType = "photo";
      payload = {
        sourceType,
        imageBase64: rendered.imageBase64,
        imageMimeType: rendered.mimeType,
        fileName: file.name,
      };
    }

    onProgress?.({ phase: "processing", done: 1, total: 1, label: file.name });
    const job = await songsApi.createImportJob(payload);

    return {
      jobId: job.id,
      fileName: file.name,
      sourceType,
      previewImage,
      pageCount,
    };
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
    _session: unknown,
    options: unknown,
    ctx: SongImportContext,
  ): Promise<ProviderImportResult> {
    const o = options as SheetMusicImportOptions;
    const song: Partial<Song> & { title: string } = {
      ...ctx.songData,
      title: o.title,
      artist: o.artist,
      content: o.content,
      folderId: o.folderId ?? ctx.songData.folderId ?? null,
      tags: o.tags,
    };

    const result = await ctx.sink.createSongsBatch([song]);
    return {
      providerId: this.id,
      fileTypeName: this.fileTypeName,
      created: result.created.length,
      failed: result.failed,
      ignored: 0,
    };
  }

  getPrepareProgressTitle(t: ImportTranslate) {
    return t("modals.sheetMusicImport.progressTitle");
  }

  getCommitProgressTitle(t: ImportTranslate) {
    return t("modals.sheetMusicImport.saveSong");
  }

  getPreparedToast(_session: unknown, t: ImportTranslate) {
    return {
      title: t("modals.sheetMusicImport.readyTitle"),
      description: t("modals.sheetMusicImport.readyDesc"),
    };
  }

  getSuccessMessage(result: ProviderImportResult, t: ImportTranslate) {
    return t("modals.sheetMusicImport.success", { count: result.created });
  }

  getErrorMessage(error: unknown, t: ImportTranslate) {
    if (error instanceof Error && error.message) return error.message;
    return t("modals.sheetMusicImport.failed");
  }

  async isActive(): Promise<boolean> {
    try {
      const settings = await aiApi.getSettings();
      return settings.configured && settings.enabled;
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) return false;
      throw error;
    }
  }
}
