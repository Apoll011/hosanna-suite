import assert from "node:assert/strict";
import test from "node:test";

import {
  FOLDER_COLORS,
  FOLDER_ICONS,
  getFolderColorStyle,
  getFolderIconComponent,
} from "../../src/utils/folderCustomization";

test("getFolderColorStyle returns default for missing or default id", () => {
  assert.equal(getFolderColorStyle(undefined).id, "default");
  assert.equal(getFolderColorStyle(null).id, "default");
  assert.equal(getFolderColorStyle("default").id, "default");
  assert.equal(getFolderColorStyle("default").colorHex, FOLDER_COLORS[0].colorHex);
});

test("getFolderColorStyle resolves known colors and falls back unknown", () => {
  const red = getFolderColorStyle("red");
  assert.equal(red.id, "red");
  assert.equal(red.colorHex, "#ef4444");
  assert.equal(getFolderColorStyle("not-a-color").id, "default");
});

test("getFolderIconComponent returns a component for known and unknown ids", () => {
  const DefaultIcon = getFolderIconComponent(undefined);
  const MusicIcon = getFolderIconComponent("music");
  const FallbackIcon = getFolderIconComponent("nope");

  assert.equal(typeof DefaultIcon, "function");
  assert.equal(typeof MusicIcon, "function");
  assert.equal(FallbackIcon, DefaultIcon);
  assert.ok(FOLDER_ICONS.some((option) => option.id === "music"));
});
