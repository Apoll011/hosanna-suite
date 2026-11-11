import assert from "node:assert/strict";
import { before, describe, it } from "node:test";

process.env.SKIP_ENV_VALIDATION ??= "true";

const { isBase64Image, isExternalImageUrl } = await import("../lib/db/supabase");

describe("isBase64Image", () => {
  it("detects data:image URIs", () => {
    assert.equal(isBase64Image("data:image/png;base64,iVBORw0KGgo="), true);
    assert.equal(isBase64Image("data:image/jpeg;base64,/9j/4AAQ"), true);
  });

  it("detects long raw base64 payloads", () => {
    assert.equal(isBase64Image("A".repeat(100)), true);
    assert.equal(isBase64Image("A".repeat(99)), false);
  });

  it("rejects ordinary URLs and short strings", () => {
    assert.equal(isBase64Image("https://example.com/a.png"), false);
    assert.equal(isBase64Image("hello"), false);
    assert.equal(isBase64Image("data:text/plain;base64,aaaa"), false);
  });
});

describe("isExternalImageUrl", () => {
  before(() => {
    assert.equal(typeof isExternalImageUrl, "function");
  });

  it("requires http(s)", () => {
    assert.equal(isExternalImageUrl("/relative.png"), false);
    assert.equal(isExternalImageUrl("ftp://files.example/a.png"), false);
  });

  it("treats non-supabase http(s) URLs as external", () => {
    assert.equal(isExternalImageUrl("https://cdn.example.com/avatar.png"), true);
    assert.equal(isExternalImageUrl("http://example.com/x.jpg"), true);
  });

  it("rejects placeholder supabase storage URLs used under SKIP_ENV_VALIDATION", () => {
    // With missing env, lib/supabase.ts falls back to https://placeholder.supabase.co
    assert.equal(
      isExternalImageUrl("https://placeholder.supabase.co/storage/v1/object/public/avatars/u.png"),
      false,
    );
  });
});
