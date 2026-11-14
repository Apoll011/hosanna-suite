/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Song } from "@/src/types";
import { createLocalImportSink, type ImportSink } from "./sink";
import {
  ImportProgressCallback,
  ImportResult,
  ProviderImportResult,
  ProvidersMetadata,
  SongImportProvider,
} from "./types";

export interface ImportFilesOptions {
  songData?: Partial<Song>;
  sink?: ImportSink;
  onProgress?: ImportProgressCallback;
}

export class SongImportRegistry {
  private readonly providers = new Map<string, SongImportProvider>();
  private readonly byId = new Map<string, SongImportProvider>();

  register(provider: SongImportProvider) {
    this.byId.set(provider.id, provider);
    for (const ext of provider.supportedExtensions) {
      this.providers.set(ext.toLowerCase(), provider);
    }
  }

  getProvider(extension: string) {
    return this.providers.get(extension.toLowerCase());
  }

  getProviderById(id: string) {
    return this.byId.get(id);
  }

  getProviders(): ProvidersMetadata[] {
    const providers = new Map<string, ProvidersMetadata>();

    this.byId.forEach((provider) => {
      providers.set(provider.id, {
        id: provider.id,
        name: provider.name,
        description: provider.description,
        supportedExtensions: provider.supportedExtensions,
        interactive: provider.interactive,
      });
    });

    return [...providers.values()];
  }

  async importFiles(
    files: readonly File[],
    songDataOrOptions: Partial<Song> | ImportFilesOptions = {},
  ): Promise<ImportResult> {
    const options: ImportFilesOptions =
      "songData" in songDataOrOptions ||
      "sink" in songDataOrOptions ||
      "onProgress" in songDataOrOptions
        ? (songDataOrOptions as ImportFilesOptions)
        : { songData: songDataOrOptions as Partial<Song> };

    const songData = options.songData ?? {};
    const sink = options.sink ?? createLocalImportSink();
    const onProgress = options.onProgress;

    const grouped = new Map<SongImportProvider, File[]>();
    const results: ProviderImportResult[] = [];

    for (const file of files) {
      const dot = file.name.lastIndexOf(".");
      const extension = dot >= 0 ? file.name.substring(dot).toLowerCase() : "";
      const provider = this.providers.get(extension);

      if (!provider || provider.interactive) {
        results.push({
          providerId: provider?.id ?? "unknown",
          fileTypeName: provider?.fileTypeName ?? (extension || "Unknown"),
          created: 0,
          failed: 0,
          ignored: 1,
        });
        continue;
      }

      const bucket = grouped.get(provider);
      if (bucket) bucket.push(file);
      else grouped.set(provider, [file]);
    }

    for (const [provider, providerFiles] of grouped) {
      const result = await provider.import(providerFiles, {
        songData,
        sink,
        onProgress,
      });

      results.push({
        providerId: provider.id,
        fileTypeName: provider.fileTypeName,
        created: result.created,
        failed: result.failed,
        ignored: result.ignored,
      });
    }

    return {
      success: results.every((r) => r.failed === 0),
      results,
    };
  }
}
