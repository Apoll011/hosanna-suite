/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  deepEqual,
  diffNewDocumentState,
  omitVolatile,
  stripNonReplicatedFields,
} from "../src/replication/wire";

test("deepEqual: primitives and nested objects", () => {
  assert.equal(deepEqual(1, 1), true);
  assert.equal(deepEqual("a", "b"), false);
  assert.equal(deepEqual({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 2 } }), true);
  assert.equal(deepEqual({ a: 1 }, { a: 1, b: 2 }), false);
  assert.equal(deepEqual([1, 2], [1, 2]), true);
  assert.equal(deepEqual([1, 2], [1, 3]), false);
  assert.equal(deepEqual(null, null), true);
  assert.equal(deepEqual(null, {}), false);
});

test("omitVolatile strips metadata fields", () => {
  const doc = {
    id: "1",
    title: "Hi",
    updatedAt: "2024-01-01T00:00:00.000Z",
    _rev: "abc",
    _meta: {},
    _attachments: {},
  };
  const stripped = omitVolatile(doc);
  assert.equal("updatedAt" in stripped, false);
  assert.equal("_rev" in stripped, false);
  assert.equal(stripped.title, "Hi");
  assert.equal(stripped.id, "1");
});

test("stripNonReplicatedFields removes local + internal fields", () => {
  const doc = {
    id: "s1",
    updatedAt: "2024-01-01T00:00:00.000Z",
    title: "Song",
    songCount: 3,
    score: 42,
    __tombstone: true,
  };
  const out = stripNonReplicatedFields(doc, new Set(["songCount"]));
  assert.equal("songCount" in out, false);
  assert.equal("score" in out, false);
  assert.equal("__tombstone" in out, false);
  assert.equal(out.title, "Song");
});

test("diffNewDocumentState: create sends full doc minus volatile", () => {
  const current = {
    id: "1",
    updatedAt: "2024-01-02T00:00:00.000Z",
    title: "A",
    _rev: "x",
    _deleted: false,
  };
  const delta = diffNewDocumentState(current, null) as Record<string, unknown>;
  assert.equal(delta.id, "1");
  assert.equal(delta.title, "A");
  assert.equal("_rev" in delta, false);
  assert.equal("updatedAt" in delta, false);
});

test("diffNewDocumentState: update sends only changed fields + id/updatedAt", () => {
  const previous = {
    id: "1",
    updatedAt: "2024-01-01T00:00:00.000Z",
    title: "A",
    body: "same",
    _deleted: false,
  };
  const current = {
    id: "1",
    updatedAt: "2024-01-02T00:00:00.000Z",
    title: "B",
    body: "same",
    _deleted: false,
  };
  const delta = diffNewDocumentState(current, previous);
  assert.deepEqual(delta, {
    id: "1",
    updatedAt: "2024-01-02T00:00:00.000Z",
    title: "B",
  });
});
