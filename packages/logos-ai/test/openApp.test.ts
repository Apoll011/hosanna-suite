/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  resolveHosannaAppOrigin,
  warmHosannaAppOrigin,
} from "../src/core/bridge/openApp.ts";

describe("resolveHosannaAppOrigin", () => {
  it("uses saas for apex marketing site", () => {
    assert.equal(resolveHosannaAppOrigin("saas"), "https://hosanna.live");
    assert.equal(resolveHosannaAppOrigin("www"), "https://hosanna.live");
  });

  it("builds subdomain origins with optional dev- prefix", () => {
    assert.equal(
      resolveHosannaAppOrigin("studio", { currentHost: "studio.hosanna.live" }),
      "https://studio.hosanna.live",
    );
    assert.equal(
      resolveHosannaAppOrigin("auth", { currentHost: "dev-auth.hosanna.live" }),
      "https://dev-auth.hosanna.live",
    );
  });

  it("honors overrides for local env", () => {
    assert.equal(
      resolveHosannaAppOrigin("studio", {
        overrides: { studio: "http://localhost:5173/" },
      }),
      "http://localhost:5173",
    );
  });
});

describe("warmHosannaAppOrigin", () => {
  it("is a no-op without document (node tests)", () => {
    assert.doesNotThrow(() => warmHosannaAppOrigin("https://auth.hosanna.live"));
  });
});
