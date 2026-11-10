import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { coerceAuthMount, defaultAuthMount } from "../../src/lib/flags.js";

describe("auth-mount flag helpers", () => {
  it("defaults to local when AUTH_URL is unset", () => {
    assert.equal(defaultAuthMount(undefined), "local");
  });

  it("defaults to delegate when AUTH_URL is set", () => {
    assert.equal(defaultAuthMount("https://auth.hosanna.live"), "delegate");
  });

  it("coerces known variants", () => {
    assert.equal(coerceAuthMount("local", "delegate"), "local");
    assert.equal(coerceAuthMount("delegate", "local"), "delegate");
    assert.equal(coerceAuthMount("off", "local"), "off");
  });

  it("falls back on unknown values", () => {
    assert.equal(coerceAuthMount("nope", "delegate"), "delegate");
    assert.equal(coerceAuthMount(undefined, "off"), "off");
  });
});
