/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DOMAINS,
  domainForLogosKind,
  domainIdForPermission,
  permissionsForDomain,
  permissionsForOrgRole,
  resolveEffectivePermissions,
} from "../src/index.js";

describe("domains", () => {
  it("maps Logos kinds to domains", () => {
    assert.equal(domainForLogosKind("song")?.id, "music.song");
    assert.equal(domainForLogosKind("service")?.id, "music.service");
  });

  it("maps permission strings to domain ids", () => {
    assert.equal(domainIdForPermission("song.update"), "music.song");
    assert.equal(domainIdForPermission("service.access"), "music.service");
  });

  it("lists song permissions from the domain", () => {
    const perms = permissionsForDomain("music.song");
    assert.ok(perms.includes("song.access"));
    assert.ok(perms.includes("song.update"));
    assert.ok(perms.includes("song.delete"));
  });

  it("covers every Logos-editable domain", () => {
    assert.ok(DOMAINS.some((d) => d.logosKind === "song"));
    assert.ok(DOMAINS.some((d) => d.logosKind === "service"));
  });
});

describe("resolveEffectivePermissions", () => {
  it("allows guest song.access and denies song.update", () => {
    const report = resolveEffectivePermissions({ orgRole: "guest" });
    assert.ok(report.allowed.includes("song.access"));
    assert.ok(report.denied.includes("song.update"));
    assert.equal(report.orgRole, "guest");
  });

  it("gives owner all domain permissions", () => {
    const ownerPerms = permissionsForOrgRole("owner");
    const report = resolveEffectivePermissions({ orgRole: "owner" });
    assert.equal(report.denied.length, 0);
    assert.equal(report.allowed.length, ownerPerms.length);
  });
});
