import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_TYPE_DEFINITION,
  getTypeDefinition,
  NOTIFICATION_TYPES,
} from "../src/catalog/types.js";

describe("getTypeDefinition", () => {
  it("returns registered security types with forced email", () => {
    const def = getTypeDefinition("auth.verify_email");
    assert.equal(def.category, "security");
    assert.deepEqual(def.forcedChannels, ["email"]);
    assert.equal(def.userOverridable, false);
  });

  it("returns agenda defaults for assignment notifications", () => {
    const def = getTypeDefinition("assignment_created");
    assert.equal(def.category, "agenda");
    assert.ok(def.defaultChannels.includes("inbox"));
    assert.ok(def.defaultChannels.includes("push"));
    assert.equal(def.userOverridable, true);
  });

  it("falls back to product defaults for unknown types", () => {
    const def = getTypeDefinition("custom.announcement");
    assert.equal(def.type, "custom.announcement");
    assert.equal(def.category, DEFAULT_TYPE_DEFINITION.category);
    assert.deepEqual(def.defaultChannels, DEFAULT_TYPE_DEFINITION.defaultChannels);
    assert.equal(def.userOverridable, true);
  });

  it("exposes a non-empty type registry", () => {
    assert.ok(Object.keys(NOTIFICATION_TYPES).length >= 10);
  });
});
