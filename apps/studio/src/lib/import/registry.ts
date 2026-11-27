/**
 * @license
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { isTransientNetworkError } from "@hosanna/replication/replication";
import { getDatabase } from "@/src/db";
import { Song } from "@/src/types";
import type { HosanaDatabase } from "@/src/db";
import { createLocalImportSink, type ImportSink } from "./sink";
import {
  ImportProgressCallback,
  ImportResult,
  isInteractiveImportProvider,
  ProviderImportResult,
  ProvidersMetadata,
  SongImportProvider,
} from "./types";
import type { ImportPermissions } from "./hosannaExport";

export interface ImportFilesOptions {
  songData?: Partial<Song>;
  sink?: ImportSink;
  db?: HosanaDatabase;
  permissions?: ImportPermissions;
  onProgress?: ImportProgressCallback;
}

function fileExtension(file: File): string {
  const dot = file.name.lastIndexOf(".");
  return dot >= 0 ? file.name.substring(dot).toLowerCase() : "";
}

export class SongImportRegistry {
  private readonly providers = new Map<string, SongImportProvider>();
  private readonly byId = new Map<string, SongImportProvider>();
  private registered: SongImportProvider[] = [];

  register(provider: SongImportProvider) {
    this.registered.push(provider);
  }

  /** Re-run isActive() for every registered provider and rebuild the active maps. */
  async refresh(): Promise<void> {
    const byId = new Map<string, SongImportProvider>();
    const providers = new Map<string, SongImportProvider>();
    for (const provider of this.registered) {
      try {
        const active = await provider.isActive();
        if (!active) continue;
      } catch (error: unknown) {
        if (!isTransientNetworkError(error)) {
          console.error(`Failed to activate import provider "${provider.id}".`, error);
        }
        continue;
      }
      byId.set(provider.id, provider);
      for (const ext of provider.supportedExtensions) {
        providers.set(ext.toLowerCase(), provider);
      }
    }
    this.byId.clear();
    byId.forEach((provider, id) => this.byId.set(id, provider));
    this.providers.clear();
    providers.forEach((provider, ext) => this.providers.set(ext, provider));
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

  getInteractiveProviders(): SongImportProvider[] {
    return [...this.byId.values()].filter(isInteractiveImportProvider);
  }

  async matchInteractiveProvider(file: File): Promise<SongImportProvider | null> {
    await this.refresh();
    for (const provider of this.getInteractiveProviders()) {
      if (provider.matchesFile) {
        if (await provider.matchesFile(file)) return provider;
        continue;
      }
      if (this.providers.get(fileExtension(file)) === provider) return provider;
    }
    return null;
  }

  async partitionFiles(files: readonly File[]): Promise<{
    interactive: Array<{ provider: SongImportProvider; files: File[] }>;
    direct: File[];
  }> {
    await this.refresh();
    const interactiveMap = new Map<SongImportProvider, File[]>();
    const direct: File[] = [];

    for (const file of files) {
      const interactive = await this.matchInteractiveProvider(file);
      if (interactive) {
        const bucket = interactiveMap.get(interactive);
        if (bucket) bucket.push(file);
        else interactiveMap.set(interactive, [file]);
        continue;
      }
      direct.push(file);
    }

    return {
      interactive: [...interactiveMap.entries()].map(([provider, providerFiles]) => ({
        provider,
        files: providerFiles,
      })),
      direct,
    };
  }

  async importFiles(
    files: readonly File[],
    songDataOrOptions: Partial<Song> | ImportFilesOptions = {},
  ): Promise<ImportResult> {
    await this.refresh();
    const options: ImportFilesOptions =
      "songData" in songDataOrOptions ||
      "sink" in songDataOrOptions ||
      "db" in songDataOrOptions ||
      "permissions" in songDataOrOptions ||
      "onProgress" in songDataOrOptions
        ? (songDataOrOptions as ImportFilesOptions)
        : { songData: songDataOrOptions as Partial<Song> };

    const songData = options.songData ?? {};
    const sink = options.sink ?? createLocalImportSink();
    const onProgress = options.onProgress;
    const db = options.db ?? (await getDatabase());
    const permissions = options.permissions ?? {
      canCreateSong: false,
      canCreateFolder: false,
      canCreateCollection: false,
      canWrite: false,
    };

    const grouped = new Map<SongImportProvider, File[]>();
    const results: ProviderImportResult[] = [];

    for (const file of files) {
      const extension = fileExtension(file);
      const provider = this.providers.get(extension);

      if (!provider || isInteractiveImportProvider(provider)) {
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
        db,
        permissions,
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
