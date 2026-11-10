import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_LOCALE, t, warmLocale } from "../../src/lib/i18n.js";

describe("i18n", () => {
  it("defaults to pt-PT", () => {
    assert.equal(DEFAULT_LOCALE, "pt-PT");
  });

  it("resolves nested keys for the canonical locale", () => {
    assert.equal(t("pt-PT", "song.not_found"), "A música não existe.");
  });

  it("interpolates {{var}} placeholders", () => {
    const out = t("en-US", "error.route_not_found", { method: "GET", path: "/songs" });
    assert.equal(out, "No route matches GET /songs");
  });

  it("leaves missing interpolation vars intact", () => {
    const out = t("en-US", "error.route_not_found", { method: "POST" });
    assert.equal(out, "No route matches POST {{path}}");
  });

  it("falls back to pt-PT for unknown locales", () => {
    assert.equal(t("zz-ZZ", "song.not_found"), "A música não existe.");
  });

  it("falls back to the key when nothing resolves", () => {
    assert.equal(t("pt-PT", "does.not.exist" as "song.not_found"), "does.not.exist");
  });

  it("serves English for en-US", () => {
    assert.equal(t("en-US", "song.not_found"), "The song does not exist.");
  });

  it("aliases pt-BR to the pt-PT catalog", () => {
    assert.equal(t("pt-BR", "folder.deleted"), t("pt-PT", "folder.deleted"));
  });

  it("warmLocale is a no-op for already-registered locales", async () => {
    await warmLocale("en-US");
    assert.match(t("en-US", "error.unauthenticated"), /Unauthenticated/);
  });
});
