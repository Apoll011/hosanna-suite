/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ImportProgressCallback } from "../types";
import { readFileBufferWithProgress, yieldToUi } from "../readFile";
import {
  SONGBOOK_UNFILED_ID,
  type SongbookBackupDocument,
  type SongbookFolder,
  type SongbookSetlistSummary,
  type SongbookSong,
} from "./types";
import { extractZipTextFile, isZipBuffer } from "./zip";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function parseJsonArrayField(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function stripVersionHeader(text: string): string {
  const trimmed = text.replace(/^\uFEFF/, "");
  const brace = trimmed.indexOf("{");
  if (brace < 0) {
    throw new Error("SongbookPro backup JSON not found.");
  }
  return trimmed.slice(brace);
}

function parseFolder(raw: unknown): SongbookFolder | null {
  const row = asRecord(raw);
  if (!row) return null;
  const id = asNumber(row.Id ?? row.id, Number.NaN);
  if (!Number.isFinite(id)) return null;
  return {
    id,
    name: asString(row.Name ?? row.name, `Setlist ${id}`).trim() || `Setlist ${id}`,
    order: asNumber(row.Order ?? row.order, 0),
    deleted: Boolean(row.Deleted ?? row.deleted),
  };
}

function parseSong(raw: unknown): SongbookSong | null {
  const row = asRecord(raw);
  if (!row) return null;
  const id = asNumber(row.Id ?? row.id, Number.NaN);
  if (!Number.isFinite(id)) return null;

  const folderIds = parseJsonArrayField(row._folders ?? row.folders)
    .map((v) => asNumber(v, Number.NaN))
    .filter((v) => Number.isFinite(v));

  const tags = parseJsonArrayField(row._tags ?? row.tags)
    .map((v) => asString(v).trim())
    .filter(Boolean);

  const songNumberRaw = row.SongNumber ?? row.songNumber;
  const songNumber = typeof songNumberRaw === "number" && songNumberRaw > 0 ? songNumberRaw : null;

  const durationRaw = asNumber(row.Duration ?? row.duration, 0);
  const duration2 = asNumber(row.Duration2 ?? row.duration2, 0);
  const durationSeconds = durationRaw > 0 ? durationRaw : duration2;

  return {
    id,
    syncId: asString(row.SyncId ?? row.syncId) || null,
    name: asString(row.name ?? row.Name, "Untitled").trim() || "Untitled",
    subTitle: asString(row.subTitle ?? row.SubTitle).trim(),
    author: asString(row.author ?? row.Author).trim(),
    content: asString(row.content ?? row.Content),
    key: typeof row.key === "number" ? row.key : typeof row.Key === "number" ? row.Key : null,
    keyShift: asNumber(row.KeyShift ?? row.keyShift, 0),
    capo: asNumber(row.Capo ?? row.capo, 0),
    tempo: asNumber(row.TempoInt ?? row.tempo, 0),
    timeSig: asString(row.timeSig ?? row.TimeSig).trim(),
    copyright: asString(row.Copyright ?? row.copyright).trim(),
    notes: asString(row.NotesText ?? row.notes).trim(),
    songNumber,
    sectionOrder: asString(row.SectionOrder ?? row.sectionOrder).trim(),
    url: asString(row.Url ?? row.url).trim(),
    durationSeconds,
    tags,
    folderIds,
    deleted: Boolean(row.Deleted ?? row.deleted),
    modifiedAt: asString(row.ModifiedDateTime ?? row.modifiedAt) || null,
  };
}

export function parseSongbookBackupJson(
  text: string,
  sourceLabel = "SongbookPro backup",
): SongbookBackupDocument {
  const parsed = JSON.parse(stripVersionHeader(text)) as unknown;
  const root = asRecord(parsed);
  if (!root) {
    throw new Error("Invalid SongbookPro backup root.");
  }

  const folders = (Array.isArray(root.folders) ? root.folders : [])
    .map(parseFolder)
    .filter((f): f is SongbookFolder => Boolean(f) && !f!.deleted)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

  const songs = (Array.isArray(root.songs) ? root.songs : [])
    .map(parseSong)
    .filter((s): s is SongbookSong => Boolean(s) && !s!.deleted);

  if (songs.length === 0) {
    throw new Error("No songs found in SongbookPro backup.");
  }

  return { folders, songs, sourceLabel };
}

export async function parseSongbookBackupJsonAsync(
  text: string,
  sourceLabel = "SongbookPro backup",
  onProgress?: ImportProgressCallback,
): Promise<SongbookBackupDocument> {
  onProgress?.({ phase: "processing", done: 0, total: 1 });
  await yieldToUi();

  const parsed = JSON.parse(stripVersionHeader(text)) as unknown;
  const root = asRecord(parsed);
  if (!root) {
    throw new Error("Invalid SongbookPro backup root.");
  }

  const folders = (Array.isArray(root.folders) ? root.folders : [])
    .map(parseFolder)
    .filter((f): f is SongbookFolder => Boolean(f) && !f!.deleted)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

  const rawSongs = Array.isArray(root.songs) ? root.songs : [];
  const songs: SongbookSong[] = [];
  const total = Math.max(1, rawSongs.length);
  const yieldEvery = total >= 1000 ? 50 : 100;

  for (let i = 0; i < rawSongs.length; i++) {
    const song = parseSong(rawSongs[i]);
    if (song && !song.deleted) songs.push(song);
    if ((i + 1) % yieldEvery === 0) {
      onProgress?.({ phase: "processing", done: i + 1, total });
      await yieldToUi();
    }
  }

  if (songs.length === 0) {
    throw new Error("No songs found in SongbookPro backup.");
  }

  onProgress?.({ phase: "processing", done: total, total });
  return { folders, songs, sourceLabel };
}

export function isSongbookBackupObject(value: unknown): boolean {
  const root = asRecord(value);
  if (!root) return false;
  if (!Array.isArray(root.songs) || root.songs.length === 0) return false;
  const sample = asRecord(root.songs[0]);
  if (!sample) return false;
  return (
    ("content" in sample || "Content" in sample) &&
    ("name" in sample || "Name" in sample) &&
    ("_folders" in sample || "folders" in sample || Array.isArray(root.folders))
  );
}

export async function parseSongbookBackupFile(
  file: File,
  onProgress?: ImportProgressCallback,
): Promise<SongbookBackupDocument> {
  const buffer = await readFileBufferWithProgress(file, ({ bytesRead, totalBytes }) => {
    onProgress?.({
      phase: "reading",
      done: bytesRead,
      total: Math.max(1, totalBytes),
      label: file.name,
    });
  });
  let text: string;

  if (isZipBuffer(buffer) || file.name.toLowerCase().endsWith(".sbpbackup")) {
    onProgress?.({ phase: "processing", done: 0, total: 1, label: file.name });
    await yieldToUi();
    const extracted = await extractZipTextFile(buffer, ["datafile.txt"]);
    if (!extracted) {
      throw new Error("Could not find dataFile.txt inside the SongbookPro backup.");
    }
    text = extracted;
  } else {
    text = new TextDecoder("utf-8").decode(buffer);
  }

  return parseSongbookBackupJsonAsync(text, file.name, onProgress);
}

export function summarizeSongbookSetlists(doc: SongbookBackupDocument): SongbookSetlistSummary[] {
  const folderMap = new Map(doc.folders.map((f) => [f.id, f]));
  const counts = new Map<number, number>();

  for (const song of doc.songs) {
    const ids = song.folderIds.length > 0 ? song.folderIds : [SONGBOOK_UNFILED_ID];
    for (const id of new Set(ids)) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }

  const summaries: SongbookSetlistSummary[] = [];
  for (const folder of doc.folders) {
    const songCount = counts.get(folder.id) ?? 0;
    if (songCount === 0) continue;
    summaries.push({ id: folder.id, name: folder.name, songCount });
  }

  const unfiled = counts.get(SONGBOOK_UNFILED_ID) ?? 0;
  if (unfiled > 0) {
    summaries.push({
      id: SONGBOOK_UNFILED_ID,
      name: "Unfiled",
      songCount: unfiled,
    });
  }

  for (const [id, songCount] of counts) {
    if (id === SONGBOOK_UNFILED_ID) continue;
    if (folderMap.has(id)) continue;
    summaries.push({ id, name: `Setlist ${id}`, songCount });
  }

  return summaries.sort((a, b) => a.name.localeCompare(b.name));
}

export function looksLikeSongbookBackupFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith(".sbpbackup") || name === "datafile.txt" || name.endsWith(".sbpbackup.json");
}

export async function detectSongbookBackupFile(file: File): Promise<boolean> {
  if (looksLikeSongbookBackupFile(file)) return true;

  const name = file.name.toLowerCase();
  if (!name.endsWith(".txt") && !name.endsWith(".json")) return false;

  const head = await file.slice(0, 4096).text();
  const brace = head.indexOf("{");
  if (brace < 0) return false;
  const snippet = head.slice(brace);
  return (
    /"songs"\s*:\s*\[/.test(snippet) &&
    (/_folders/.test(snippet) || /"folders"\s*:\s*\[/.test(snippet))
  );
}
