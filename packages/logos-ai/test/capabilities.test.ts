/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AUTH_HOST_PROFILE,
  STUDIO_HOST_PROFILE,
  hasCapability,
  musicAppId,
  planningAppId,
  thinHostProfile,
} from "../src/host/capabilities.ts";

describe("host capabilities", () => {
  it("Studio has local navigate/editor/print", () => {
    assert.equal(hasCapability(STUDIO_HOST_PROFILE, "navigate.local"), true);
    assert.equal(hasCapability(STUDIO_HOST_PROFILE, "editor.songs"), true);
    assert.equal(hasCapability(STUDIO_HOST_PROFILE, "print"), true);
  });

  it("Auth is catalog-only and hands off to studio", () => {
    assert.equal(hasCapability(AUTH_HOST_PROFILE, "catalog.songs"), true);
    assert.equal(hasCapability(AUTH_HOST_PROFILE, "editor.songs"), false);
    assert.equal(hasCapability(AUTH_HOST_PROFILE, "navigate.local"), false);
    assert.equal(musicAppId(AUTH_HOST_PROFILE), "studio");
    assert.equal(planningAppId(AUTH_HOST_PROFILE), "studio");
  });

  it("thinHostProfile defaults for future apps", () => {
    const presenter = thinHostProfile("presenter");
    assert.equal(presenter.appId, "presenter");
    assert.equal(hasCapability(presenter, "catalog.songs"), true);
    assert.equal(hasCapability(presenter, "editor.songs"), false);
    assert.equal(musicAppId(presenter), "studio");
  });
});
