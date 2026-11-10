/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from "node:assert/strict";
import test from "node:test";

import { parseUserAgent } from "../../src/lib/parseUserAgent";

test("parseUserAgent returns unknowns for nullish input", () => {
  assert.deepEqual(parseUserAgent(null), {
    client: null,
    os: null,
    device: null,
    deviceType: "unknown",
    isApp: false,
  });
  assert.deepEqual(parseUserAgent(undefined), {
    client: null,
    os: null,
    device: null,
    deviceType: "unknown",
    isApp: false,
  });
  assert.deepEqual(parseUserAgent(""), {
    client: null,
    os: null,
    device: null,
    deviceType: "unknown",
    isApp: false,
  });
});

test("parseUserAgent parses Flutter app UA", () => {
  const info = parseUserAgent(
    "Hosanna/1.0.4 (Android 14 (API 34); Pixel 8) Flutter/3.47.2",
  );

  assert.equal(info.isApp, true);
  assert.equal(info.client, "Hosanna 1.0.4");
  assert.equal(info.os, "Android 14");
  assert.equal(info.device, "Pixel 8");
  assert.equal(info.deviceType, "mobile");
});

test("parseUserAgent parses Chrome desktop UA", () => {
  const info = parseUserAgent(
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36",
  );

  assert.equal(info.isApp, false);
  assert.equal(info.client, "Chrome 151");
  assert.equal(info.os, "Linux");
  assert.equal(info.device, null);
  assert.equal(info.deviceType, "desktop");
});

test("parseUserAgent parses iPhone Safari UA", () => {
  const info = parseUserAgent(
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
  );

  assert.equal(info.isApp, false);
  assert.equal(info.client, "Safari 17.4");
  assert.equal(info.os, "iOS 17.4");
  assert.equal(info.device, "iPhone");
  assert.equal(info.deviceType, "mobile");
});
