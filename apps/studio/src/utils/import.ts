import { Song } from "@/src/types";

export interface SongImportProvider {
  readonly id: string;
  readonly name: string;
  readonly fileTypeName: string;
  readonly description?: string;

  readonly supportedExtensions: readonly string[];

  import(
    files: readonly File[],
    songData: Partial<Song>,
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
