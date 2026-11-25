// SPDX-License-Identifier: AGPL-3.0-only
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseHosannaExportJson } from "@hosanna/types";
import {
  buildHosannaExportDocument,
  formatExportFilename,
} from "../../../src/lib/export/hosannaExport";

describe("buildHosannaExportDocument", () => {
  const folders = [
    { id: "f-root", name: "Worship", parentId: null, color: "sky", icon: "music" },
    { id: "f-sub", name: "Christmas", parentId: "f-root" },
    { id: "f-deep", name: "Carols", parentId: "f-sub" },
    { id: "f-other", name: "Youth", parentId: null },
    { id: "f-deleted", name: "Trashed", parentId: "f-root", isDeleted: true },
  ];

  const songs = [
    {
      id: "s-1",
      title: "Amazing Grace",
      artist: "John Newton",
      folderId: "f-root",
      tags: ["hymn"],
      content: "{title: Amazing Grace}\n[G]Amazing grace",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "s-2",
      title: "Silent Night",
      artist: "Franz Gruber",
      folderId: "f-deep",
      tags: ["christmas"],
      content: "{title: Silent Night}\n[C]Silent night",
      updatedAt: "2026-01-02T00:00:00.000Z",
    },
    {
      id: "s-3",
      title: "Oceans",
      artist: "Hillsong",
      folderId: "f-other",
      tags: [],
      content: "{title: Oceans}\n[D]You call me out",
      updatedAt: "2026-01-03T00:00:00.000Z",
    },
    {
      id: "s-deleted",
      title: "Deleted Song",
      artist: "Someone",
      folderId: "f-root",
      tags: [],
      content: "",
      deleted: true,
    },
  ];

  const collections = [
    {
      id: "c-1",
      name: "Sunday Set",
      songIds: ["s-1", "s-3", "s-deleted"],
    },
  ];

  it("exports folders recursively and skips deleted items", () => {
    const doc = buildHosannaExportDocument({
      orgId: "org-1",
      selectedFolderIds: ["f-root"],
      folders,
      songs,
      collections,
      exportedAt: "2026-11-25T00:00:00.000Z",
    });

    assert.equal(doc.format, "hosanna-export");
    assert.equal(doc.version, 1);
    assert.deepEqual(doc.source, { orgId: "org-1", app: "studio" });
    assert.deepEqual(
      doc.folders.map((f) => f.id),
      ["f-root", "f-sub", "f-deep"],
    );
    assert.deepEqual(
      doc.songs.map((s) => s.id),
      ["s-1", "s-2"],
    );
    assert.equal(doc.collections.length, 0);
  });

  it("normalizes parentId to null when an exported folder's parent is not exported", () => {
    const doc = buildHosannaExportDocument({
      selectedFolderIds: ["f-sub"],
      folders,
      songs,
      collections,
    });

    const sub = doc.folders.find((f) => f.id === "f-sub");
    const deep = doc.folders.find((f) => f.id === "f-deep");
    assert.equal(sub?.parentId, null);
    assert.equal(deep?.parentId, "f-sub");
  });

  it("includes collection-referenced songs and deduplicates across direct, folder, and collection routes", () => {
    const doc = buildHosannaExportDocument({
      selectedFolderIds: ["f-root"],
      selectedSongIds: ["s-1", "s-2"],
      selectedCollectionIds: ["c-1"],
      folders,
      songs,
      collections,
    });

    assert.deepEqual(
      doc.songs.map((s) => s.id).sort(),
      ["s-1", "s-2", "s-3"],
    );
    const s3 = doc.songs.find((s) => s.id === "s-3");
    assert.equal(s3?.folderId, null);
    assert.deepEqual(doc.collections[0]?.songIds, ["s-1", "s-3"]);

    const roundTrip = parseHosannaExportJson(JSON.stringify(doc));
    assert.equal(roundTrip.ok, true);
  });

  it("formats export filenames as hosanna-export-YYYY-MM-DD.json", () => {
    const filename = formatExportFilename(new Date(2026, 10, 5));
    assert.equal(filename, "hosanna-export-2026-11-05.json");
  });
});
