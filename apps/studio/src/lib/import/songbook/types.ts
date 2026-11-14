/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SongbookFolder {
  id: number;
  name: string;
  order: number;
  deleted: boolean;
}

export interface SongbookSong {
  id: number;
  syncId: string | null;
  name: string;
  subTitle: string;
  author: string;
  content: string;
  key: number | null;
  keyShift: number;
  capo: number;
  tempo: number;
  timeSig: string;
  copyright: string;
  notes: string;
  songNumber: number | null;
  sectionOrder: string;
  url: string;
  durationSeconds: number;
  tags: string[];
  folderIds: number[];
  deleted: boolean;
  modifiedAt: string | null;
}

export interface SongbookBackupDocument {
  folders: SongbookFolder[];
  songs: SongbookSong[];
  sourceLabel: string;
}

export interface SongbookSetlistSummary {
  id: number;
  name: string;
  songCount: number;
}

export interface SongbookImportOptions {
  selectedSetlistIds: number[];
  alsoCreateCollections: boolean;
}

export interface SongbookImportPlanSong {
  title: string;
  artist: string;
  content: string;
  tags: string[];
  song_number: number | null;
  path: string;
  folderKey: string | null;
  collectionKeys: string[];
  createdAt?: string;
}

export interface SongbookImportPlan {
  alsoCreateCollections: boolean;
  folders: Array<{ key: string; name: string }>;
  collections: Array<{ key: string; name: string }>;
  songs: SongbookImportPlanSong[];
  skipped: number;
}

export const SONGBOOK_UNFILED_ID = 0;
