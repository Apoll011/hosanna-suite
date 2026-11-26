// SPDX-License-Identifier: AGPL-3.0-only
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  HOSANNA_EXPORT_MAX_BYTES,
  parseHosannaExportJson,
  type HosannaExportDocument,
} from "@hosanna/types";
import type { CollectionDocType, FolderDocType, SongDocType } from "../../../src/db/schemas";
import { buildHosannaExportDocument } from "../../../src/lib/export/hosannaExport";
import {
  executeHosannaImportWithStore,
  HosannaImportError,
  planHosannaImport,
  type HosannaImportStore,
  type ImportPermissions,
} from "../../../src/lib/import/hosannaExport";

const FULL_PERMISSIONS: ImportPermissions = {
  canCreateFolder: true,
  canCreateSong: true,
  canCreateCollection: true,
  canWrite: true,
};

function createMemoryStore(initial?: {
  folders?: FolderDocType[];
  songs?: SongDocType[];
  collections?: CollectionDocType[];
}): HosannaImportStore {
  const folders = [...(initial?.folders ?? [])];
  const songs = [...(initial?.songs ?? [])];
  const collections = [...(initial?.collections ?? [])];

  return {
    folders,
    songs,
    collections,
    async insertFolders(docs) {
      folders.push(...docs);
    },
    async insertSongs(docs) {
      songs.push(...docs);
    },
    async patchSong(id, patch) {
      const idx = songs.findIndex((s) => s.id === id);
      if (idx >= 0) {
        songs[idx] = { ...songs[idx]!, ...patch };
      }
    },
    async insertCollections(docs) {
      collections.push(...docs);
    },
  };
}

function makeSeqIdGenerator() {
  let i = 1;
  return () => `new-id-${i++}`;
}

describe("parseHosannaExportJson", () => {
  it("rejects malformed JSON", () => {
    const res = parseHosannaExportJson("{not valid json");
    assert.equal(res.ok, false);
    if (!res.ok) assert.equal(res.code, "malformed_json");
  });

  it("rejects files exceeding size limit", () => {
    const res = parseHosannaExportJson("{}", HOSANNA_EXPORT_MAX_BYTES + 1);
    assert.equal(res.ok, false);
    if (!res.ok) assert.equal(res.code, "file_too_large");
  });

  it("rejects wrong format", () => {
    const res = parseHosannaExportJson(JSON.stringify({ format: "other", version: 1 }));
    assert.equal(res.ok, false);
    if (!res.ok) assert.equal(res.code, "invalid_format");
  });

  it("rejects unknown or newer versions", () => {
    const res = parseHosannaExportJson(
      JSON.stringify({
        format: "hosanna-export",
        version: 99,
        exportedAt: "2026-11-25T00:00:00.000Z",
      }),
    );
    assert.equal(res.ok, false);
    if (!res.ok) {
      assert.equal(res.code, "unsupported_version");
      assert.equal(res.foundVersion, 99);
    }
  });
});

describe("hosannaExport import planner & executor", () => {
  const sampleExport: HosannaExportDocument = buildHosannaExportDocument({
    orgId: "org-source",
    selectedFolderIds: ["src-f1"],
    selectedCollectionIds: ["src-c1"],
    folders: [
      { id: "src-f1", name: "Worship", parentId: null, color: "sky" },
      { id: "src-f2", name: "Acoustic", parentId: "src-f1" },
    ],
    songs: [
      {
        id: "src-s1",
        title: "Grace",
        artist: "Newton",
        folderId: "src-f2",
        tags: ["hymn"],
        content: "[G]Grace",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    collections: [{ id: "src-c1", name: "Sunday", songIds: ["src-s1"] }],
  });

  it("round-trips export into an empty org with remapped IDs", async () => {
    const store = createMemoryStore();
    const result = await executeHosannaImportWithStore(store, sampleExport, {
      permissions: FULL_PERMISSIONS,
      generateId: makeSeqIdGenerator(),
      now: "2026-11-25T00:00:00.000Z",
    });

    assert.deepEqual(result, {
      foldersCreated: 2,
      songsCreated: 1,
      songsOverwritten: 0,
      songsSkipped: 0,
      collectionsCreated: 1,
    });

    assert.equal(store.folders.length, 2);
    assert.equal(store.songs.length, 1);
    assert.equal(store.collections.length, 1);

    const [f1, f2] = store.folders;
    const [s1] = store.songs;
    const [c1] = store.collections;

    assert.notEqual(f1?.id, "src-f1");
    assert.notEqual(f2?.id, "src-f2");
    assert.equal(f2?.parentId, f1?.id);

    assert.notEqual(s1?.id, "src-s1");
    assert.equal(s1?.folderId, f2?.id);
    assert.equal(s1?.path, "Acoustic/Grace.pro");

    assert.notEqual(c1?.id, "src-c1");
    assert.deepEqual(c1?.songIds, [s1?.id]);
  });

  it("places top-level imported items under targetFolderId", async () => {
    const store = createMemoryStore({
      folders: [
        {
          id: "dest-folder",
          name: "Imported",
          parentId: null,
        },
      ],
    });

    await executeHosannaImportWithStore(store, sampleExport, {
      permissions: FULL_PERMISSIONS,
      targetFolderId: "dest-folder",
      generateId: makeSeqIdGenerator(),
    });

    const importedRoot = store.folders.find((f) => f.name === "Worship");
    assert.equal(importedRoot?.parentId, "dest-folder");
  });

  it("handles skip, keep-both, and overwrite conflict policies", async () => {
    const existingSong: SongDocType = {
      id: "existing-s1",
      title: "Grace",
      artist: "Newton",
      content: "OLD CONTENT",
      folderId: null,
      path: "Grace.pro",
      tags: ["old"],
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:00:00.000Z",
    };

    const preview = planHosannaImport(sampleExport, {
      folders: [],
      songs: [existingSong],
      collections: [],
    });
    assert.equal(preview.conflicts.length, 1);

    // 1. skip
    const skipStore = createMemoryStore({ songs: [{ ...existingSong }] });
    const skipRes = await executeHosannaImportWithStore(skipStore, sampleExport, {
      permissions: FULL_PERMISSIONS,
      conflictPolicy: "skip",
      generateId: makeSeqIdGenerator(),
    });
    assert.equal(skipRes.songsSkipped, 1);
    assert.equal(skipStore.songs.length, 1);
    assert.equal(skipStore.songs[0]?.content, "OLD CONTENT");
    assert.deepEqual(skipStore.collections[0]?.songIds, ["existing-s1"]);

    // 2. keep-both
    const keepStore = createMemoryStore({ songs: [{ ...existingSong }] });
    const keepRes = await executeHosannaImportWithStore(keepStore, sampleExport, {
      permissions: FULL_PERMISSIONS,
      conflictPolicy: "keep-both",
      generateId: makeSeqIdGenerator(),
    });
    assert.equal(keepRes.songsCreated, 1);
    assert.equal(keepStore.songs.length, 2);
    assert.equal(keepStore.songs[1]?.title, "Grace (2)");

    // 3. overwrite
    const overwriteStore = createMemoryStore({ songs: [{ ...existingSong }] });
    const overwriteRes = await executeHosannaImportWithStore(overwriteStore, sampleExport, {
      permissions: FULL_PERMISSIONS,
      conflictPolicy: "overwrite",
      generateId: makeSeqIdGenerator(),
    });
    assert.equal(overwriteRes.songsOverwritten, 1);
    assert.equal(overwriteStore.songs.length, 1);
    assert.equal(overwriteStore.songs[0]?.content, "[G]Grace");
    assert.deepEqual(overwriteStore.collections[0]?.songIds, ["existing-s1"]);
  });

  it("denies import when permissions are missing or subscription write gate is closed", async () => {
    const store = createMemoryStore();

    await assert.rejects(
      () =>
        executeHosannaImportWithStore(store, sampleExport, {
          permissions: {
            canCreateFolder: false,
            canCreateSong: true,
            canCreateCollection: true,
            canWrite: true,
          },
        }),
      (err: unknown) =>
        err instanceof HosannaImportError &&
        err.code === "permission_denied" &&
        err.missingPermissions.includes("folder.create"),
    );

    await assert.rejects(
      () =>
        executeHosannaImportWithStore(store, sampleExport, {
          permissions: {
            ...FULL_PERMISSIONS,
            canWrite: false,
          },
        }),
      (err: unknown) => err instanceof HosannaImportError && err.code === "subscription_blocked",
    );
  });
});
