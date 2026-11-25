// SPDX-License-Identifier: AGPL-3.0-only
import type {
  HosannaExportCollection,
  HosannaExportDocument,
  HosannaExportFolder,
  HosannaExportSong,
} from "@hosanna/types";
import { recalculateAllDerivedCounts, type HosanaDatabase } from "@/src/db";
import type { CollectionDocType, FolderDocType, SongDocType } from "@/src/db/schemas";

export type ImportConflictPolicy = "skip" | "keep-both" | "overwrite";

export interface ImportPermissions {
  canCreateSong: boolean;
  canCreateFolder: boolean;
  canCreateCollection: boolean;
  canWrite: boolean;
}

export type HosannaImportErrorCode = "subscription_blocked" | "permission_denied";

export class HosannaImportError extends Error {
  readonly code: HosannaImportErrorCode;
  readonly missingPermissions: string[];

  constructor(code: HosannaImportErrorCode, message: string, missingPermissions: string[] = []) {
    super(message);
    this.name = "HosannaImportError";
    this.code = code;
    this.missingPermissions = missingPermissions;
  }
}

export interface SongImportConflict {
  exportSong: HosannaExportSong;
  existingSongId: string;
  existingTitle: string;
  existingArtist: string;
}

export interface PlannedFolderCreate {
  sourceId: string;
  doc: FolderDocType;
}

export interface PlannedSongCreate {
  kind: "create";
  sourceId: string;
  doc: SongDocType;
}

export interface PlannedSongOverwrite {
  kind: "overwrite";
  sourceId: string;
  targetId: string;
  patch: Partial<SongDocType>;
}

export interface PlannedSongSkip {
  kind: "skip";
  sourceId: string;
  existingId: string;
}

export type PlannedSongOperation = PlannedSongCreate | PlannedSongOverwrite | PlannedSongSkip;

export interface PlannedCollectionCreate {
  sourceId: string;
  doc: CollectionDocType;
}

export interface HosannaImportPlan {
  counts: {
    folders: number;
    songs: number;
    collections: number;
  };
  conflicts: SongImportConflict[];
  folderIdMap: Map<string, string>;
  songIdMap: Map<string, string>;
  collectionIdMap: Map<string, string>;
  foldersToCreate: PlannedFolderCreate[];
  songOperations: PlannedSongOperation[];
  collectionsToCreate: PlannedCollectionCreate[];
}

export interface PlanHosannaImportOptions {
  targetFolderId?: string | null;
  conflictPolicy?: ImportConflictPolicy;
  generateId?: () => string;
  now?: string;
}

export interface ExecuteHosannaImportResult {
  foldersCreated: number;
  songsCreated: number;
  songsOverwritten: number;
  songsSkipped: number;
  collectionsCreated: number;
}

export interface ExistingImportLibraryState {
  folders: readonly FolderDocType[];
  songs: readonly SongDocType[];
  collections: readonly CollectionDocType[];
}

export interface HosannaImportStore extends ExistingImportLibraryState {
  insertFolders: (docs: FolderDocType[]) => Promise<void>;
  insertSongs: (docs: SongDocType[]) => Promise<void>;
  patchSong: (id: string, patch: Partial<SongDocType>) => Promise<void>;
  insertCollections: (docs: CollectionDocType[]) => Promise<void>;
  recalculateCounts?: () => Promise<void>;
}

function isActive(doc: { _deleted?: boolean; isDeleted?: boolean }): boolean {
  return !doc._deleted && !doc.isDeleted;
}

export function normalizeSongMatchKey(title: string, artist: string): string {
  return `${title.trim().toLowerCase()}\0${(artist ?? "").trim().toLowerCase()}`;
}

function sortFoldersTopologically(folders: readonly HosannaExportFolder[]): HosannaExportFolder[] {
  const byId = new Map<string, HosannaExportFolder>();
  for (const folder of folders) {
    byId.set(folder.id, folder);
  }

  const visited = new Set<string>();
  const visiting = new Set<string>();
  const sorted: HosannaExportFolder[] = [];

  const visit = (folder: HosannaExportFolder) => {
    if (visited.has(folder.id) || visiting.has(folder.id)) return;
    visiting.add(folder.id);
    if (folder.parentId && byId.has(folder.parentId)) {
      visit(byId.get(folder.parentId)!);
    }
    visiting.delete(folder.id);
    visited.add(folder.id);
    sorted.push(folder);
  };

  for (const folder of folders) {
    visit(folder);
  }

  return sorted;
}

function computePathForSong(
  title: string,
  folderId: string | null,
  folderNameById: ReadonlyMap<string, string>,
): string {
  const trimmedTitle = title.trim();
  if (!folderId) return `${trimmedTitle}.pro`;
  const folderName = folderNameById.get(folderId);
  return folderName ? `${folderName.trim()}/${trimmedTitle}.pro` : `${trimmedTitle}.pro`;
}

function resolveUniqueTitleAndPath(
  baseTitle: string,
  folderId: string | null,
  folderNameById: ReadonlyMap<string, string>,
  usedPaths: Set<string>,
  startWithSuffix: boolean,
): { title: string; path: string } {
  const trimmed = baseTitle.trim();
  let candidateTitle = startWithSuffix ? `${trimmed} (2)` : trimmed;
  let candidatePath = computePathForSong(candidateTitle, folderId, folderNameById);
  let suffix = startWithSuffix ? 3 : 2;

  while (usedPaths.has(candidatePath.toLowerCase())) {
    candidateTitle = `${trimmed} (${suffix})`;
    candidatePath = computePathForSong(candidateTitle, folderId, folderNameById);
    suffix++;
  }

  usedPaths.add(candidatePath.toLowerCase());
  return { title: candidateTitle, path: candidatePath };
}

export function assertImportPermissions(
  doc: HosannaExportDocument,
  permissions: ImportPermissions,
): void {
  if (!permissions.canWrite) {
    throw new HosannaImportError(
      "subscription_blocked",
      "An active subscription or trial is required to import items.",
    );
  }

  const missing: string[] = [];
  if (doc.folders.length > 0 && !permissions.canCreateFolder) {
    missing.push("folder.create");
  }
  if (doc.songs.length > 0 && !permissions.canCreateSong) {
    missing.push("song.create");
  }
  if (doc.collections.length > 0 && !permissions.canCreateCollection) {
    missing.push("collection.create");
  }

  if (missing.length > 0) {
    throw new HosannaImportError(
      "permission_denied",
      `Missing required permissions: ${missing.join(", ")}`,
      missing,
    );
  }
}

export function planHosannaImport(
  doc: HosannaExportDocument,
  existing: ExistingImportLibraryState,
  options: PlanHosannaImportOptions = {},
): HosannaImportPlan {
  const generateId = options.generateId ?? (() => crypto.randomUUID());
  const now = options.now ?? new Date().toISOString();
  const targetFolderId = options.targetFolderId ?? null;
  const conflictPolicy: ImportConflictPolicy = options.conflictPolicy ?? "skip";

  const activeExistingFolders = existing.folders.filter(isActive);
  const activeExistingSongs = existing.songs.filter(isActive);

  const folderNameById = new Map<string, string>();
  for (const folder of activeExistingFolders) {
    folderNameById.set(folder.id, folder.name);
  }

  const folderIdMap = new Map<string, string>();
  const sortedFolders = sortFoldersTopologically(doc.folders);
  for (const folder of sortedFolders) {
    const newId = generateId();
    folderIdMap.set(folder.id, newId);
    folderNameById.set(newId, folder.name.trim());
  }

  const foldersToCreate: PlannedFolderCreate[] = sortedFolders.map((folder) => {
    const newId = folderIdMap.get(folder.id)!;
    const remappedParentId =
      folder.parentId && folderIdMap.has(folder.parentId)
        ? folderIdMap.get(folder.parentId)!
        : targetFolderId;

    return {
      sourceId: folder.id,
      doc: {
        id: newId,
        name: folder.name.trim(),
        parentId: remappedParentId,
        color: folder.color ?? "default",
        icon: folder.icon ?? "default",
        songCount: 0,
        folderCount: 0,
        createdAt: now,
        updatedAt: now,
        _deleted: false,
      },
    };
  });

  const existingSongByMatchKey = new Map<string, SongDocType>();
  const usedPaths = new Set<string>();
  for (const song of activeExistingSongs) {
    const key = normalizeSongMatchKey(song.title, song.artist);
    if (!existingSongByMatchKey.has(key)) {
      existingSongByMatchKey.set(key, song);
    }
    if (song.path) {
      usedPaths.add(song.path.toLowerCase());
    }
  }

  const conflicts: SongImportConflict[] = [];
  const songIdMap = new Map<string, string>();
  const songOperations: PlannedSongOperation[] = [];

  const collectionIdMap = new Map<string, string>();
  for (const col of doc.collections) {
    collectionIdMap.set(col.id, generateId());
  }

  const sourceSongToNewCollectionIds = new Map<string, string[]>();
  for (const col of doc.collections) {
    const newColId = collectionIdMap.get(col.id)!;
    for (const sourceSongId of col.songIds) {
      const list = sourceSongToNewCollectionIds.get(sourceSongId);
      if (list) {
        if (!list.includes(newColId)) list.push(newColId);
      } else {
        sourceSongToNewCollectionIds.set(sourceSongId, [newColId]);
      }
    }
  }

  for (const song of doc.songs) {
    const matchKey = normalizeSongMatchKey(song.title, song.artist);
    const matchedExisting = existingSongByMatchKey.get(matchKey);

    if (matchedExisting) {
      conflicts.push({
        exportSong: song,
        existingSongId: matchedExisting.id,
        existingTitle: matchedExisting.title,
        existingArtist: matchedExisting.artist,
      });
    }

    const remappedFolderId =
      song.folderId && folderIdMap.has(song.folderId)
        ? folderIdMap.get(song.folderId)!
        : targetFolderId;
    const extraCollectionIds = sourceSongToNewCollectionIds.get(song.id) ?? [];

    if (matchedExisting && conflictPolicy === "skip") {
      songIdMap.set(song.id, matchedExisting.id);
      songOperations.push({
        kind: "skip",
        sourceId: song.id,
        existingId: matchedExisting.id,
      });
      continue;
    }

    if (matchedExisting && conflictPolicy === "overwrite") {
      songIdMap.set(song.id, matchedExisting.id);
      const mergedCollectionIds = Array.from(
        new Set([...(matchedExisting.collectionIds ?? []), ...extraCollectionIds]),
      );
      songOperations.push({
        kind: "overwrite",
        sourceId: song.id,
        targetId: matchedExisting.id,
        patch: {
          content: song.content,
          tags: [...song.tags],
          ...(song.song_number !== undefined ? { song_number: song.song_number } : {}),
          collectionIds: mergedCollectionIds,
          updatedAt: now,
        },
      });
      continue;
    }

    const newId = generateId();
    songIdMap.set(song.id, newId);
    const { title, path } = resolveUniqueTitleAndPath(
      song.title,
      remappedFolderId,
      folderNameById,
      usedPaths,
      Boolean(matchedExisting && conflictPolicy === "keep-both"),
    );

    songOperations.push({
      kind: "create",
      sourceId: song.id,
      doc: {
        id: newId,
        title,
        artist: song.artist ?? "",
        content: song.content,
        folderId: remappedFolderId,
        collectionIds: extraCollectionIds,
        path,
        tags: [...song.tags],
        ...(song.song_number !== undefined ? { song_number: song.song_number } : {}),
        createdAt: now,
        updatedAt: song.updatedAt ?? now,
        _deleted: false,
      },
    });
  }

  const collectionsToCreate: PlannedCollectionCreate[] = doc.collections.map(
    (col: HosannaExportCollection) => {
      const newId = collectionIdMap.get(col.id)!;
      const remappedSongIds: string[] = [];
      const seen = new Set<string>();
      for (const sourceSongId of col.songIds) {
        const mapped = songIdMap.get(sourceSongId);
        if (mapped && !seen.has(mapped)) {
          seen.add(mapped);
          remappedSongIds.push(mapped);
        }
      }

      return {
        sourceId: col.id,
        doc: {
          id: newId,
          name: col.name.trim(),
          description: col.description ?? null,
          color: col.color ?? "default",
          icon: col.icon ?? "default",
          image: null,
          songCount: remappedSongIds.length,
          songIds: remappedSongIds,
          createdAt: now,
          updatedAt: now,
          _deleted: false,
        },
      };
    },
  );

  return {
    counts: {
      folders: foldersToCreate.length,
      songs: songOperations.filter((op) => op.kind !== "skip").length,
      collections: collectionsToCreate.length,
    },
    conflicts,
    folderIdMap,
    songIdMap,
    collectionIdMap,
    foldersToCreate,
    songOperations,
    collectionsToCreate,
  };
}

export async function executeHosannaImportWithStore(
  store: HosannaImportStore,
  doc: HosannaExportDocument,
  options: PlanHosannaImportOptions & { permissions: ImportPermissions },
): Promise<ExecuteHosannaImportResult> {
  assertImportPermissions(doc, options.permissions);

  const plan = planHosannaImport(doc, store, options);

  if (plan.foldersToCreate.length > 0) {
    await store.insertFolders(plan.foldersToCreate.map((f) => f.doc));
  }

  const songsToCreate = plan.songOperations
    .filter((op): op is PlannedSongCreate => op.kind === "create")
    .map((op) => op.doc);
  if (songsToCreate.length > 0) {
    await store.insertSongs(songsToCreate);
  }

  const songsToOverwrite = plan.songOperations.filter(
    (op): op is PlannedSongOverwrite => op.kind === "overwrite",
  );
  for (const op of songsToOverwrite) {
    await store.patchSong(op.targetId, op.patch);
  }

  if (plan.collectionsToCreate.length > 0) {
    await store.insertCollections(plan.collectionsToCreate.map((c) => c.doc));
  }

  await store.recalculateCounts?.();

  return {
    foldersCreated: plan.foldersToCreate.length,
    songsCreated: songsToCreate.length,
    songsOverwritten: songsToOverwrite.length,
    songsSkipped: plan.songOperations.filter((op) => op.kind === "skip").length,
    collectionsCreated: plan.collectionsToCreate.length,
  };
}

export function createIndexedDbImportStore(db: HosanaDatabase): HosannaImportStore {
  return {
    folders: db.folders.getAllRaw(),
    songs: db.songs.getAllRaw(),
    collections: db.collections.getAllRaw(),
    async insertFolders(docs) {
      for (const doc of docs) {
        await db.folders.insert(doc as unknown as Parameters<typeof db.folders.insert>[0]);
      }
    },
    async insertSongs(docs) {
      const chunkSize = 150;
      for (let i = 0; i < docs.length; i += chunkSize) {
        const chunk = docs.slice(i, i + chunkSize);
        await db.songs.bulkInsert(chunk as unknown as Parameters<typeof db.songs.bulkInsert>[0]);
      }
    },
    async patchSong(id, patch) {
      const doc = await db.songs.findOne(id).exec();
      if (doc) {
        await doc.patch(patch);
      }
    },
    async insertCollections(docs) {
      for (const doc of docs) {
        await db.collections.insert(doc as unknown as Parameters<typeof db.collections.insert>[0]);
      }
    },
    async recalculateCounts() {
      await recalculateAllDerivedCounts(db);
    },
  };
}

export async function executeHosannaImport(
  db: HosanaDatabase,
  doc: HosannaExportDocument,
  options: PlanHosannaImportOptions & { permissions: ImportPermissions },
): Promise<ExecuteHosannaImportResult> {
  const store = createIndexedDbImportStore(db);
  return executeHosannaImportWithStore(store, doc, options);
}
