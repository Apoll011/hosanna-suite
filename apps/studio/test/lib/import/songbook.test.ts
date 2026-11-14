/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  buildSongbookImportPlan,
  convertSongbookCommentSections,
  migrateSongbookSongToChordPro,
  parseSongbookBackupFile,
  parseSongbookBackupJson,
  songbookKeyToChordPro,
  summarizeSongbookSetlists,
} from "../../../src/lib/import/songbook";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../../../../");
const samplePath = join(root, "sb/Backup SongbookPro 2 ago/dataFile.txt");
const zipPath = join(root, "sb/SongbookPro Backup.sbpbackup");

describe("songbook import", () => {
  it("maps SongbookPro key codes to ChordPro keys", () => {
    assert.equal(songbookKeyToChordPro(0), "C");
    assert.equal(songbookKeyToChordPro(5), "F");
    assert.equal(songbookKeyToChordPro(10), "Bb");
    assert.equal(songbookKeyToChordPro(21), "Am");
    assert.equal(songbookKeyToChordPro(22), "Bbm");
    assert.equal(songbookKeyToChordPro(null), null);
  });

  it("parses the local SongbookPro dataFile and summarizes setlists", () => {
    const text = readFileSync(samplePath, "utf8");
    const doc = parseSongbookBackupJson(text, "dataFile.txt");
    assert.ok(doc.songs.length > 1000);
    assert.ok(doc.folders.length >= 10);

    const setlists = summarizeSongbookSetlists(doc);
    assert.ok(setlists.some((s) => s.name.includes("Livro De Louvor")));
    assert.ok(setlists.every((s) => s.songCount > 0));
  });

  it("migrates song metadata into ChordPro directives", () => {
    const text = readFileSync(samplePath, "utf8");
    const doc = parseSongbookBackupJson(text, "dataFile.txt");
    const song = doc.songs.find((s) => s.name === "Quando Ouvires");
    assert.ok(song);

    const migrated = migrateSongbookSongToChordPro(song!);
    assert.equal(migrated.title, "Quando Ouvires");
    assert.match(migrated.content, /\{title:\s*Quando Ouvires\}/);
    assert.match(migrated.content, /\{artist:/);
    assert.match(migrated.content, /\{start_of_verse/);
    assert.match(migrated.content, /\{start_of_chorus/);
    assert.match(migrated.content, /\{end_of_chorus\}/);
    assert.ok(!/\{c:\s*Verse\}/i.test(migrated.content));
    assert.ok(migrated.tags.includes("SongbookPro"));
  });

  it("converts SongbookPro {c:} labels into section environments", () => {
    const converted = convertSongbookCommentSections(`{c: Verse1}
Line one

{c: Chorus}
Refrain

{c: Bridge}
Bridge line

{c: Intro}
{sot}
tab
{eot}
`);
    assert.match(converted, /\{start_of_verse:\s*Verse1\}/);
    assert.match(converted, /\{end_of_verse\}/);
    assert.match(converted, /\{start_of_chorus:\s*Chorus\}/);
    assert.match(converted, /\{start_of_bridge:\s*Bridge\}/);
    assert.match(converted, /\{start_of_part:\s*Intro\}/);
    assert.match(converted, /\{start_of_tab\}/);
    assert.match(converted, /\{end_of_tab\}/);
  });

  it("plans folder mode from the first selected setlist only", () => {
    const text = readFileSync(samplePath, "utf8");
    const doc = parseSongbookBackupJson(text, "dataFile.txt");
    const multi = doc.songs.find((s) => s.folderIds.length > 1);
    assert.ok(multi);

    const primary = multi!.folderIds[0]!;
    const secondary = multi!.folderIds[1]!;
    const plan = buildSongbookImportPlan(doc, {
      mode: "folders",
      selectedSetlistIds: [primary, secondary],
    });

    const planned = plan.songs.find((s) => s.title === multi!.name);
    assert.ok(planned);
    assert.equal(planned!.folderKey, `setlist:${primary}`);
    assert.deepEqual(planned!.collectionKeys, []);
  });

  it("parses a .sbpbackup zip archive", async () => {
    const bytes = readFileSync(zipPath);
    const file = new File([bytes], "SongbookPro Backup.sbpbackup", {
      type: "application/octet-stream",
    });
    const doc = await parseSongbookBackupFile(file);
    assert.ok(doc.songs.length > 0);
    assert.ok(doc.folders.length > 0);
  });

  it("plans collection mode with multi-setlist membership", () => {
    const text = readFileSync(samplePath, "utf8");
    const doc = parseSongbookBackupJson(text, "dataFile.txt");
    const multi = doc.songs.find((s) => s.folderIds.length > 1);
    assert.ok(multi);

    const [a, b] = multi!.folderIds;
    const plan = buildSongbookImportPlan(doc, {
      mode: "collections",
      selectedSetlistIds: [a!, b!],
    });

    const planned = plan.songs.find((s) => s.title === multi!.name);
    assert.ok(planned);
    assert.equal(planned!.folderKey, null);
    assert.deepEqual(planned!.collectionKeys, [`setlist:${a}`, `setlist:${b}`]);
    assert.equal(plan.collections.length, 2);
  });
});
