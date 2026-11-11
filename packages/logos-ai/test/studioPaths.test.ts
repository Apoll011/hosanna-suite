/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { libraryPathForNavigate, libraryPathForPrint } from "../src/resources/paths.ts";

describe("libraryPathForNavigate", () => {
  it("prefixes org slug for entity routes", () => {
    assert.equal(
      libraryPathForNavigate({ kind: "song", id: "s1" }, "/acme"),
      "/acme/songs/s1",
    );
    assert.equal(
      libraryPathForNavigate({ kind: "service", id: "svc" }, "/acme"),
      "/acme/services/svc",
    );
  });

  it("handles list kinds and empty slug", () => {
    assert.equal(libraryPathForNavigate({ kind: "songs", id: null }, ""), "/songs");
    assert.equal(libraryPathForNavigate({ kind: "trash", id: null }, "/x"), "/x/trash");
  });
});

describe("libraryPathForPrint", () => {
  it("maps print kinds to entity paths", () => {
    assert.equal(libraryPathForPrint({ kind: "song", ids: ["a"] }, "/org"), "/org/songs/a");
    assert.equal(libraryPathForPrint({ kind: "event", ids: ["e1"] }, "/org"), "/org/agenda/e1");
  });
});
