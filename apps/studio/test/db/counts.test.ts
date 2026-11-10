/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateCollectionSongCount,
  calculateFolderCount,
  calculateFolderSongCount,
  recalculateCollectionCounts,
  recalculateFolderCounts,
} from "../../src/db/counts";

test("calculateFolderSongCount ignores deleted songs", () => {
  const songs = [
    { folderId: "f1", isDeleted: false, _deleted: false },
    { folderId: "f1", isDeleted: true, _deleted: false },
    { folderId: "f1", isDeleted: false, _deleted: true },
    { folderId: "f2", isDeleted: false, _deleted: false },
  ];
  assert.equal(calculateFolderSongCount("f1", songs), 1);
});

test("calculateFolderSongCount returns 0 for empty folder", () => {
  assert.equal(calculateFolderSongCount("missing", []), 0);
  assert.equal(
    calculateFolderSongCount("missing", [{ folderId: "other", isDeleted: false, _deleted: false }]),
    0,
  );
});

test("calculateFolderCount ignores deleted subfolders", () => {
  const folders = [
    { parentId: "f1", isDeleted: false, _deleted: false },
    { parentId: "f1", isDeleted: true, _deleted: false },
    { parentId: null, isDeleted: false, _deleted: false },
  ];
  assert.equal(calculateFolderCount("f1", folders), 1);
});

test("recalculateFolderCounts sets songCount and folderCount", () => {
  const folders = [
    {
      id: "root",
      name: "Root",
      parentId: null,
      songCount: 0,
      folderCount: 0,
      isDeleted: false,
    },
    {
      id: "child",
      name: "Child",
      parentId: "root",
      songCount: 0,
      folderCount: 0,
      isDeleted: false,
    },
  ];
  const songs = [
    { folderId: "root", isDeleted: false },
    { folderId: "root", isDeleted: false },
    { folderId: "child", isDeleted: false },
  ];
  const next = recalculateFolderCounts(folders as never, songs);
  const root = next.find((f) => f.id === "root")!;
  const child = next.find((f) => f.id === "child")!;
  assert.equal(root.songCount, 2);
  assert.equal(root.folderCount, 1);
  assert.equal(child.songCount, 1);
  assert.equal(child.folderCount, 0);
});

test("recalculateCollectionCounts syncs songIds and songCount", () => {
  const collections = [
    {
      id: "c1",
      name: "C",
      songIds: ["orphan"],
      songCount: 0,
      isDeleted: false,
      createdAt: "",
      updatedAt: "",
    },
  ];
  const songs = [
    { id: "s1", collectionIds: ["c1"], isDeleted: false, _deleted: false },
    { id: "s2", collectionIds: ["other"], isDeleted: false, _deleted: false },
    { id: "orphan", collectionIds: [], isDeleted: false, _deleted: false },
  ];
  const next = recalculateCollectionCounts(collections as never, songs);
  assert.equal(next[0]!.songCount, 2);
  assert.deepEqual(new Set(next[0]!.songIds), new Set(["s1", "orphan"]));
});

test("calculateCollectionSongCount ignores deleted songs", () => {
  const songs = [
    { id: "s1", collectionIds: ["c1"], isDeleted: false, _deleted: false },
    { id: "s2", collectionIds: ["c1"], isDeleted: true, _deleted: false },
    { id: "s3", collectionIds: ["c1"], isDeleted: false, _deleted: true },
  ];
  assert.equal(calculateCollectionSongCount("c1", songs), 1);
});
