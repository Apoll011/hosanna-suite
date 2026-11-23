/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from "node:assert/strict";
import test from "node:test";

import { isTransientNetworkError } from "../src/replication/network";

test("isTransientNetworkError: matches browser network failures", () => {
  assert.equal(isTransientNetworkError(new TypeError("Failed to fetch")), true);
  assert.equal(isTransientNetworkError(new TypeError("Load failed")), true);
  assert.equal(isTransientNetworkError(new TypeError("Network request failed")), true);
  assert.equal(isTransientNetworkError(new Error("NetworkError when attempting to fetch")), true);
});

test("isTransientNetworkError: matches wrapped network ApiErrors", () => {
  assert.equal(isTransientNetworkError(new Error("Network Error: Failed to fetch")), true);
});

test("isTransientNetworkError: ignores server and application errors", () => {
  assert.equal(isTransientNetworkError(new Error("Server error (500)")), false);
  assert.equal(isTransientNetworkError(new Error("Unauthorized")), false);
  assert.equal(isTransientNetworkError(new TypeError("x is not a function")), false);
  assert.equal(isTransientNetworkError("Failed to fetch"), false);
  assert.equal(isTransientNetworkError(null), false);
});
