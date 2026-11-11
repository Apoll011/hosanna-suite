/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { studioPathForNavigate, studioPathForPrint } from "../src/core/bridge/studioPaths.ts";

describe("studioPathForNavigate", () => {
  it("prefixes org slug for entity routes", () => {
    assert.equal(
      studioPathForNavigate({ kind: "song", id: "s1" }, "/acme"),
      "/acme/songs/s1",
    );
    assert.equal(
      studioPathForNavigate({ kind: "service", id: "svc" }, "/acme"),
      "/acme/services/svc",
    );
  });

  it("handles list kinds and empty slug", () => {
    assert.equal(studioPathForNavigate({ kind: "songs", id: null }, ""), "/songs");
    assert.equal(studioPathForNavigate({ kind: "trash", id: null }, "/x"), "/x/trash");
  });
});

describe("studioPathForPrint", () => {
  it("maps print kinds to entity paths", () => {
    assert.equal(
      studioPathForPrint({ kind: "song", ids: ["a"] }, "/org"),
      "/org/songs/a",
    );
    assert.equal(
      studioPathForPrint({ kind: "event", ids: ["e1"] }, "/org"),
      "/org/agenda/e1",
    );
  });
});
