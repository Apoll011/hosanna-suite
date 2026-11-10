import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  admin,
  editor,
  guest,
  musician,
  owner,
  roles,
  statement,
  teamLeader,
  toPermissionRequest,
} from "../src/index.js";

describe("toPermissionRequest", () => {
  it("splits resource.action into a request object", () => {
    assert.deepEqual(toPermissionRequest("song.create"), {
      song: ["create"],
    });
    assert.deepEqual(toPermissionRequest("billing.manage"), {
      billing: ["manage"],
    });
    assert.deepEqual(toPermissionRequest("notification.sent"), {
      notification: ["sent"],
    });
  });
});

describe("statement resources", () => {
  it("exposes Hosanna custom resources alongside organization defaults", () => {
    for (const resource of [
      "billing",
      "song",
      "service",
      "folder",
      "collection",
      "agenda",
      "settings",
      "ai",
      "library",
      "export",
      "backup",
      "notification",
    ] as const) {
      assert.ok(resource in statement);
      assert.ok(Array.isArray(statement[resource]));
      assert.ok(statement[resource].length > 0);
    }
  });
});

describe("roles catalog", () => {
  it("registers every app role", () => {
    assert.deepEqual(Object.keys(roles).sort(), [
      "admin",
      "editor",
      "guest",
      "member",
      "musician",
      "owner",
      "teamLeader",
    ]);
    assert.equal(roles.member, musician);
  });
});

describe("role authorization", () => {
  it("allows guest read access and denies mutations", () => {
    assert.equal(guest.authorize(toPermissionRequest("song.access")).success, true);
    assert.equal(guest.authorize(toPermissionRequest("song.create")).success, false);
    assert.equal(guest.authorize(toPermissionRequest("settings.manage")).success, false);
  });

  it("allows owner full billing and backup control", () => {
    assert.equal(owner.authorize(toPermissionRequest("billing.manage")).success, true);
    assert.equal(owner.authorize(toPermissionRequest("backup.import")).success, true);
    assert.equal(owner.authorize(toPermissionRequest("ai.manage")).success, true);
  });

  it("restricts admin from billing manage and backup import", () => {
    assert.equal(admin.authorize(toPermissionRequest("song.delete")).success, true);
    assert.equal(admin.authorize(toPermissionRequest("billing.manage")).success, false);
    assert.equal(admin.authorize(toPermissionRequest("backup.import")).success, false);
    assert.equal(admin.authorize(toPermissionRequest("backup.export")).success, true);
  });

  it("scopes teamLeader / editor / musician correctly", () => {
    assert.equal(teamLeader.authorize(toPermissionRequest("song.delete")).success, false);
    assert.equal(teamLeader.authorize(toPermissionRequest("ai.use")).success, true);
    assert.equal(editor.authorize(toPermissionRequest("folder.update")).success, true);
    assert.equal(editor.authorize(toPermissionRequest("settings.manage")).success, false);
    assert.equal(musician.authorize(toPermissionRequest("service.access")).success, true);
    assert.equal(musician.authorize(toPermissionRequest("service.create")).success, false);
    assert.equal(musician.authorize(toPermissionRequest("folder.create")).success, false);
  });

  it("denies guest ai.use and grants owner notification.sent", () => {
    assert.equal(guest.authorize(toPermissionRequest("ai.use")).success, false);
    assert.equal(owner.authorize(toPermissionRequest("notification.sent")).success, true);
  });
});
