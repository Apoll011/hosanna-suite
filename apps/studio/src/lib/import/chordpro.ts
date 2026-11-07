import { songsApi } from "@/src/api";
import { Song } from "@/src/types";
import { ProviderImportResult, SongImportProvider } from "@/src/utils/import";

export class ChordProImportProvider implements SongImportProvider {
  readonly id = "chordpro";
  readonly name = "ChordPro Importer";
  readonly fileTypeName = "ChordPro";
  readonly description = "Imports Simple Chordpro Files";
  readonly supportedExtensions = [".cho", ".chopro", ".pro", ".crd", ".txt"];

  cleanSongTitleFromFilename(filename: string): string {
    let name = filename.replace(/\.[^/.]+$/, "");
    name = name.replace(/\[.*?\]/g, "");
    name = name.replace(/\(.*?\)/g, "");
    name = name.replace(/\{.*?\}/g, "");
    name = name.replace(/#\w+/g, "");
    name = name.replace(/_/g, " ");
    name = name.replace(/\s+/g, " ").trim();
    return name || filename.replace(/\.[^/.]+$/, "").trim();
  }

  async import(
    files: File[],
    songData: Partial<Song>,
  ): Promise<ProviderImportResult> {
    const songPayloads: Array<Partial<Song>> = [];

    for (const file of files) {
      const fileText = await file.text();
      const cleanTitle = this.cleanSongTitleFromFilename(file.name);

      let finalContent = fileText;
      if (!/\{title\s*:/i.test(fileText)) {
        finalContent = `{title: ${cleanTitle}}\n${fileText}`;
      }

      let artist = "Vários";
      const artistMatch = fileText.match(/\{artist\s*:\s*([^}]+)\}/i);
      if (artistMatch && artistMatch[1]) {
        artist = artistMatch[1].trim();
      }

      songPayloads.push({
        title: cleanTitle,
        artist: artist,
        content: finalContent,
        tags: ["ChordPro"],
        ...songData,
      });
    }

    if (songPayloads.length > 0) {
      try {
        const res = await songsApi.createSongsBatch(songPayloads);
        return {
          providerId: this.id,
          fileTypeName: this.fileTypeName,
          created: res.count,
          failed: files.length - res.count,
          ignored: 0,
        };
      } catch {
        return {
          providerId: this.id,
          fileTypeName: this.fileTypeName,
          created: 0,
          failed: files.length,
          ignored: 0,
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
