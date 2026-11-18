import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CONSENT_COOKIE_NAME,
  CONSENT_STORAGE_KEY,
  getStoredConsent,
  setStoredConsent,
} from "../src/consent.js";

describe("cookie consent utilities", () => {
  it("exports expected cookie and storage keys", () => {
    assert.equal(CONSENT_COOKIE_NAME, "hosanna_cookie_consent");
    assert.equal(CONSENT_STORAGE_KEY, "hosanna_cookie_consent");
  });

  it("returns null in non-browser environment safely", () => {
    assert.equal(getStoredConsent(), null);
  });

  it("handles setStoredConsent in non-browser environment safely", () => {
    const record = setStoredConsent("all");
    assert.equal(record.choice, "all");
    assert.ok(typeof record.timestamp === "number");
  });
});
