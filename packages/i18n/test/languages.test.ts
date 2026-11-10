import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { DEFAULT_LANGUAGE, getLanguageMeta, LANGUAGES, localeToLanguage } from "../src/index.js";
import type { Language } from "../src/types.js";

describe("LANGUAGES catalog", () => {
  it("lists exactly three supported codes with metadata fields", () => {
    assert.equal(LANGUAGES.length, 3);
    assert.deepEqual(
      LANGUAGES.map((l) => l.code),
      ["pt", "en", "es"],
    );
    for (const lang of LANGUAGES) {
      assert.ok(lang.nativeLabel.length > 0);
      assert.ok(lang.englishLabel.length > 0);
      assert.ok(lang.flag.length > 0);
    }
    assert.equal(DEFAULT_LANGUAGE, "pt");
    assert.equal(DEFAULT_LANGUAGE, LANGUAGES[0].code);
  });
});

describe("getLanguageMeta", () => {
  it("returns the matching entry and falls back to Portuguese", () => {
    assert.equal(getLanguageMeta("en").englishLabel, "English");
    assert.equal(getLanguageMeta("es").nativeLabel, "Español");
    assert.equal(getLanguageMeta("pt").flag, "🇵🇹");
    assert.equal(getLanguageMeta("xx" as Language).code, "pt");
  });
});

describe("localeToLanguage edge cases", () => {
  it("accepts bare short codes and underscore regions", () => {
    assert.equal(localeToLanguage("pt"), "pt");
    assert.equal(localeToLanguage("en"), "en");
    assert.equal(localeToLanguage("es"), "es");
    assert.equal(localeToLanguage("pt_PT"), "pt");
    assert.equal(localeToLanguage("EN_GB"), "en");
  });
});
