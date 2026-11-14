/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SUITE_APP_REGISTRY, getSuiteAppUrl, listSuiteApps } from "../src/index.js";

const env = {
  authOrigin: "https://auth.hosanna.live",
  studioUrl: "https://studio.hosanna.live/",
  organizationSlug: "grace",
};

describe("listSuiteApps", () => {
  it("returns apps sorted by sortOrder with Account and Music live", () => {
    const apps = listSuiteApps(env);
    assert.ok(apps.length >= 6);
    const orders = apps.map((a) => a.sortOrder);
    assert.deepEqual(
      orders,
      [...orders].sort((a, b) => a - b),
    );

    const auth = apps.find((a) => a.id === "auth");
    const music = apps.find((a) => a.id === "music");
    const planning = apps.find((a) => a.id === "planning");

    assert.equal(auth?.status, "live");
    assert.equal(auth?.accessible, true);
    assert.equal(auth?.homeUrl, "https://auth.hosanna.live/account");

    assert.equal(music?.status, "live");
    assert.equal(music?.accessible, true);
    assert.equal(music?.homeUrl, "https://studio.hosanna.live/grace");

    assert.equal(planning?.status, "coming_soon");
    assert.equal(planning?.accessible, false);
  });

  it("resolves logos against each app's logoHost origin", () => {
    const apps = listSuiteApps(env);
    const auth = apps.find((a) => a.id === "auth");
    const music = apps.find((a) => a.id === "music");
    const planning = apps.find((a) => a.id === "planning");
    assert.equal(auth?.logoUrl, "https://auth.hosanna.live/favicon.png");
    assert.equal(auth?.accent, "#0F766E");
    assert.equal(music?.logoUrl, "https://studio.hosanna.live/favicon.png");
    assert.equal(music?.accent, "#0284c7");
    assert.equal(planning?.logoUrl, null);
  });

  it("exposes i18n keys for catalog labels", () => {
    const music = listSuiteApps(env).find((a) => a.id === "music");
    assert.equal(music?.nameKey, "suite.apps.music.name");
    assert.equal(music?.descriptionKey, "suite.apps.music.description");
  });

  it("omits studio slug when none is provided", () => {
    const music = listSuiteApps({
      authOrigin: "https://auth.hosanna.live",
      studioUrl: "https://studio.hosanna.live",
    }).find((a) => a.id === "music");
    assert.equal(music?.homeUrl, "https://studio.hosanna.live");
  });
});

describe("getSuiteAppUrl", () => {
  it("returns account and music URLs", () => {
    assert.equal(getSuiteAppUrl("auth", env), "https://auth.hosanna.live/account");
    assert.equal(getSuiteAppUrl("music", env), "https://studio.hosanna.live/grace");
  });
});

describe("SUITE_APP_REGISTRY", () => {
  it("covers the suite product ids used on home", () => {
    const ids = new Set(SUITE_APP_REGISTRY.map((a) => a.id));
    for (const id of ["auth", "music", "planning", "presenter", "community", "finance"]) {
      assert.ok(ids.has(id as (typeof SUITE_APP_REGISTRY)[number]["id"]));
    }
  });
});
