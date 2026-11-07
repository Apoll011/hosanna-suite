import { Song } from "@/src/types";
import {
  ImportResult,
  ProviderImportResult,
  SongImportProvider,
} from "@/src/utils/import";

export class SongImportRegistry {
  private readonly providers = new Map<string, SongImportProvider>();

  register(provider: SongImportProvider) {
    for (const ext of provider.supportedExtensions) {
      this.providers.set(ext.toLowerCase(), provider);
    }
  }

  getProvider(extension: string) {
    return this.providers.get(extension.toLowerCase());
  }

  getProviders(): ProvidersMetadata[] {
    const providers = new Map<string, ProvidersMetadata>();

    this.providers.forEach((provider) => {
      providers.set(provider.id, {
        id: provider.id,
        name: provider.name,
        description: provider.description,
        supportedExtensions: provider.supportedExtensions,
      });
    });

    return [...providers.values()];
  }

  async importFiles(
    files: readonly File[],
    songData: Partial<Song>,
  ): Promise<ImportResult> {
    const grouped = new Map<SongImportProvider, File[]>();

    const results: ProviderImportResult[] = [];

    // Group files by provider (O(n))
    for (const file of files) {
      const dot = file.name.lastIndexOf(".");
      const extension = dot >= 0 ? file.name.substring(dot).toLowerCase() : "";

      const provider = this.providers.get(extension);

      if (!provider) {
        results.push({
          providerId: "unknown",
          fileTypeName: extension || "Unknown",
          created: 0,
          failed: 0,
          ignored: 1,
        });

        continue;
      }

      const bucket = grouped.get(provider);

      if (bucket) {
        bucket.push(file);
      } else {
        grouped.set(provider, [file]);
      }
    }

    // One import call per provider
    for (const [provider, providerFiles] of grouped) {
      const result = await provider.import(providerFiles, songData);

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

interface ProvidersMetadata {
  id: string;
  name: string;
  description?: string;

  supportedExtensions: readonly string[];
}
