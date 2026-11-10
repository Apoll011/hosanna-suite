import assert from "node:assert/strict";
import test from "node:test";

import { generateDemoData } from "../../src/demo/demoData";

test("demo data includes three collections with the requested sizes", () => {
  const data = generateDemoData("en");

  assert.equal(data.collections.length, 3);
  assert.equal(data.collections[0].songIds?.length, 10);
  assert.equal(data.collections[1].songIds?.length, 10);
  assert.equal(data.collections[2].songIds?.length, 3);
  assert.ok(data.collections.every((collection) => collection.id));
});

test("demo data seeds folders, songs, services, and agenda events", () => {
  const data = generateDemoData("en");

  assert.equal(data.folders.length, 4);
  assert.equal(data.songs.length, 14);
  assert.ok(data.services.length >= 3);
  assert.ok(data.agendaEvents.length >= 4);
  assert.ok(data.songs.every((song) => song.title && song.content));
  assert.ok(data.folders.every((folder) => folder.name && folder.id));
});

test("demo locale switches folder and song titles", () => {
  const en = generateDemoData("en");
  const pt = generateDemoData("pt");
  const es = generateDemoData("es");

  assert.equal(en.folders[0].name, "Classic Hymns");
  assert.equal(pt.folders[0].name, "Hinos Clássicos");
  assert.equal(es.folders[0].name, "Himnos Clásicos");

  assert.notEqual(en.songs[0].title, pt.songs[0].title);
  assert.equal(en.collections.length, pt.collections.length);
  assert.equal(en.songs.length, es.songs.length);
});

test("demo services include past, upcoming, and archived entries", () => {
  const data = generateDemoData("en");
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  assert.ok(data.services.some((s) => s.archived === true));
  assert.ok(data.services.some((s) => s.date <= todayIso && !s.archived));
  assert.ok(data.services.some((s) => s.date > todayIso));
  assert.ok(data.services.some((s) => (s.elements ?? []).some((el) => el.type === "song")));
});
