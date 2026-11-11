import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import {
  checkPermissionAnyLocally,
  checkPermissionsLocally,
  clearPermissionCache,
  groupPermissions,
  lookupCachedAny,
  preloadPermissionsForRole,
  rememberAndResult,
} from "../src/permissions/client.js";

describe("groupPermissions", () => {
  it("groups resource.action strings and dedupes actions", () => {
    assert.deepEqual(groupPermissions(["song.create", "song.delete", "billing.manage"]), {
      song: ["create", "delete"],
      billing: ["manage"],
    });
    assert.deepEqual(groupPermissions(["song.create", "song.create"]), {
      song: ["create"],
    });
  });
});

describe("checkPermissionsLocally / checkPermissionAnyLocally", () => {
  it("returns null without a known role", () => {
    assert.equal(checkPermissionsLocally(["song.access"], null), null);
    assert.equal(checkPermissionAnyLocally(["song.access"], null), null);
  });

  it("AND-checks all permissions for a role", () => {
    assert.equal(checkPermissionsLocally(["song.access", "song.create"], "guest"), false);
    assert.equal(checkPermissionsLocally(["song.access"], "guest"), true);
    assert.equal(checkPermissionsLocally(["song.create", "ai.use"], "owner"), true);
  });

  it("OR-checks any permission for a role", () => {
    assert.equal(checkPermissionAnyLocally(["song.create", "song.access"], "guest"), true);
    assert.equal(checkPermissionAnyLocally(["song.create", "ai.use"], "guest"), false);
    assert.equal(checkPermissionAnyLocally(["notification.sent"], "owner"), true);
  });
});

describe("preloadPermissionsForRole", () => {
  beforeEach(() => clearPermissionCache());

  it("is a no-op for null and does not throw for a real role", () => {
    preloadPermissionsForRole(null);
    preloadPermissionsForRole("musician");
  });
});

describe("lookupCachedAny vs AND-batch cache", () => {
  beforeEach(() => clearPermissionCache());

  it("does not treat a cached AND denial as an OR denial", () => {
    // Guest: song.access granted, song.create denied → AND is false.
    rememberAndResult(["song.create", "song.access"], false);
    // Without this fix, useCanAny would return false from the AND cache key.
    assert.equal(lookupCachedAny(["song.create", "song.access"]), null);

    // Individual grant still wins for OR.
    rememberAndResult(["song.access"], true);
    assert.equal(lookupCachedAny(["song.create", "song.access"]), true);
  });

  it("treats a cached AND grant as an OR grant", () => {
    rememberAndResult(["song.access", "export.pdf"], true);
    assert.equal(lookupCachedAny(["song.access", "export.pdf"]), true);
  });

  it("returns false only when every permission is individually denied", () => {
    rememberAndResult(["song.create"], false);
    rememberAndResult(["ai.use"], false);
    // rememberAndResult(false) does not set individual keys — seed them via preload.
    clearPermissionCache();
    preloadPermissionsForRole("guest");
    assert.equal(lookupCachedAny(["song.create", "ai.use"]), false);
    assert.equal(lookupCachedAny(["song.create", "song.access"]), true);
  });
});
