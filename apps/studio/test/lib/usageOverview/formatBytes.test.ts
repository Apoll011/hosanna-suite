/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from "node:assert/strict";
import test from "node:test";

import { formatBytes } from "../../../src/lib/usageOverview/formatBytes";

test("formatBytes returns 0 B for negative, NaN, and non-finite values", () => {
  assert.equal(formatBytes(-1), "0 B");
  assert.equal(formatBytes(Number.NaN), "0 B");
  assert.equal(formatBytes(Number.POSITIVE_INFINITY), "0 B");
  assert.equal(formatBytes(Number.NEGATIVE_INFINITY), "0 B");
});

test("formatBytes keeps values under 1024 as whole bytes", () => {
  assert.equal(formatBytes(0), "0 B");
  assert.equal(formatBytes(1), "1 B");
  assert.equal(formatBytes(1023), "1023 B");
  assert.equal(formatBytes(512.7), "513 B");
});

test("formatBytes crosses KB / MB / GB boundaries", () => {
  assert.equal(formatBytes(1024), "1 KB");
  assert.equal(formatBytes(1536), "1.5 KB");
  assert.equal(formatBytes(10 * 1024), "10 KB");
  assert.equal(formatBytes(1024 ** 2), "1 MB");
  assert.equal(formatBytes(1.5 * 1024 ** 2), "1.5 MB");
  assert.equal(formatBytes(1024 ** 3), "1 GB");
  assert.equal(formatBytes(1024 ** 4), "1 TB");
});

test("formatBytes respects locale for fractional values", () => {
  assert.equal(formatBytes(1536, "en-US"), "1.5 KB");
  assert.equal(formatBytes(1536, "pt-BR"), "1,5 KB");
  assert.equal(formatBytes(1536, "de-DE"), "1,5 KB");
});
