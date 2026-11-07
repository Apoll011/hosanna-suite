import { songsApi } from "@/src/api";
import { Song } from "@/src/types";
import { ProviderImportResult, SongImportProvider } from "@/src/utils/import";

export class JsonImportProvider implements SongImportProvider {
  readonly id = "json";
  readonly name = "JSON Importer";
  readonly fileTypeName = "JSON";
  readonly description = "Imports songs structured in JSON format";
  readonly supportedExtensions = [".json"];

  async import(
    files: File[],
    songData: Partial<Song>,
  ): Promise<ProviderImportResult> {
    const songPayloads: Array<Partial<Song>> = [];
    const nameSet: Set<string> = new Set();
    let ignoredCount = 0;

    for (const file of files) {
      try {
        const fileText = await file.text();
        const parsedJson = JSON.parse(fileText);

        // Process object-based formats: { "root": [...], "folder-uuid-123": [...] }
        if (typeof parsedJson === "object" && !Array.isArray(parsedJson)) {
          for (const [key, songs] of Object.entries(parsedJson)) {
            if (!Array.isArray(songs)) continue;

            // Determine folderId: fallback to songData for "normal", otherwise use key (UUID)
            const targetFolderId = key === "root" ? songData.folderId : key;

            for (const item of songs) {
              if (nameSet.has(item.title)) {
                ignoredCount++;
                continue;
              }
              songPayloads.push({
                title: item.title,
                content: item.content,
                tags: item.tags || [],
                artist: item.artist || "Vários",
                ...songData,
                folderId: targetFolderId,
              });
              nameSet.add(item.title);
            }
          }
        }
        // Process flat array formats: [ { title: "...", content: "..." } ]
        else if (Array.isArray(parsedJson)) {
          for (const item of parsedJson) {
            if (nameSet.has(item.title)) {
              ignoredCount++;
              continue;
            }
            songPayloads.push({
              title: item.title,
              content: item.content,
              tags: item.tags || [],
              artist: item.artist || "Vários",
              ...songData,
            });
          }
        }
      } catch {
        ignoredCount++;
      }
    }

    if (songPayloads.length > 0) {
      try {
        const res = await songsApi.createSongsBatch(songPayloads);
        return {
          providerId: this.id,
          fileTypeName: this.fileTypeName,
          created: res.count,
          failed: songPayloads.length - res.count,
          ignored: ignoredCount,
        };
      } catch {
        return {
          providerId: this.id,
          fileTypeName: this.fileTypeName,
          created: 0,
          failed: songPayloads.length,
          ignored: ignoredCount,
        };
      }
    }

    return {
      providerId: this.id,
      fileTypeName: this.fileTypeName,
      created: 0,
      failed: 0,
      ignored: files.length,
    };
  }
}
