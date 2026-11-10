import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  AUTH_THEME_BOOT_SCRIPT,
  THEME_BG,
  THEME_COOKIE,
  THEME_STORAGE_KEY,
} from "../lib/theme-boot.ts";

describe("theme-boot constants", () => {
  it("exposes cookie and storage keys", () => {
    assert.equal(THEME_COOKIE, "hosanna_color_scheme");
    assert.equal(THEME_STORAGE_KEY, "hosanna_auth_theme");
  });

  it("exposes light and dark background colors", () => {
    assert.equal(THEME_BG.light, "#f4f6f8");
    assert.equal(THEME_BG.dark, "#0b0d12");
  });

  it("embeds keys and both bg colors in AUTH_THEME_BOOT_SCRIPT", () => {
    assert.ok(AUTH_THEME_BOOT_SCRIPT.includes(THEME_COOKIE));
    assert.ok(AUTH_THEME_BOOT_SCRIPT.includes(THEME_STORAGE_KEY));
    assert.ok(AUTH_THEME_BOOT_SCRIPT.includes(THEME_BG.light));
    assert.ok(AUTH_THEME_BOOT_SCRIPT.includes(THEME_BG.dark));
  });
});
