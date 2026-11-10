import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { newId } from "../src/core/id.js";

describe("newId", () => {
  it("returns unique non-empty strings", () => {
    const a = newId();
    const b = newId();
    assert.equal(typeof a, "string");
    assert.ok(a.length > 0);
    assert.notEqual(a, b);
  });

  it("prefers UUID format when crypto.randomUUID is available", () => {
    const id = newId();
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    } else {
      assert.match(id, /^msg_\d+_[a-z0-9]+$/);
    }
  });
});
