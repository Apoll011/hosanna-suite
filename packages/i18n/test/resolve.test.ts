import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DEFAULT_LANGUAGE,
  getLanguageMeta,
  LANGUAGE_LOCALE,
  LANGUAGES,
  localeToLanguage,
  resolveLanguage,
} from "../src/index.js";

describe("localeToLanguage", () => {
  it("maps IETF tags to supported short codes", () => {
    assert.equal(localeToLanguage("pt-BR"), "pt");
    assert.equal(localeToLanguage("en_US"), "en");
    assert.equal(localeToLanguage("es-419"), "es");
    assert.equal(localeToLanguage("PT"), "pt");
  });

  it("rejects empty and unsupported locales", () => {
    assert.equal(localeToLanguage(null), null);
    assert.equal(localeToLanguage(undefined), null);
    assert.equal(localeToLanguage(""), null);
    assert.equal(localeToLanguage("fr-FR"), null);
    assert.equal(localeToLanguage("de"), null);
  });
});

describe("resolveLanguage", () => {
  it("prefers an explicit personal language over org and browser", () => {
    assert.equal(resolveLanguage("en", "pt-BR", ["es-ES"]), "en");
    assert.equal(resolveLanguage("es", "en-US", "pt-PT"), "es");
  });

  it("falls back through org locale then browser then default", () => {
    assert.equal(resolveLanguage("auto", "es-MX", ["en-US"]), "es");
    assert.equal(resolveLanguage(undefined, "fr-FR", ["en-GB", "pt-BR"]), "en");
    assert.equal(resolveLanguage("auto", null, "pt-PT"), "pt");
    assert.equal(resolveLanguage(undefined, "zh-CN", ["ja-JP"]), DEFAULT_LANGUAGE);
    assert.equal(resolveLanguage("auto", null, null), DEFAULT_LANGUAGE);
  });

  it("accepts a single browser locale string", () => {
    assert.equal(resolveLanguage("auto", null, "es"), "es");
  });
});

describe("language metadata", () => {
  it("lists supported languages and locales", () => {
    assert.deepEqual(
      LANGUAGES.map((l) => l.code),
      ["pt", "en", "es"],
    );
    assert.equal(DEFAULT_LANGUAGE, "pt");
    assert.equal(getLanguageMeta("en").englishLabel, "English");
    assert.equal(getLanguageMeta("es").nativeLabel, "Español");
    assert.equal(LANGUAGE_LOCALE.pt, "pt-PT");
    assert.equal(LANGUAGE_LOCALE.en, "en-US");
    assert.equal(LANGUAGE_LOCALE.es, "es-ES");
  });
});
