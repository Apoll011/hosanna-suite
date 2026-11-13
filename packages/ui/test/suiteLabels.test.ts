/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { localizeSuiteApp, resolveSuiteAppLabel } from "../src/suiteLabels";

const app = {
  id: "music",
  name: "Music",
  shortName: "Music",
  description: "English fallback",
  nameKey: "suite.apps.music.name",
  descriptionKey: "suite.apps.music.description",
};

describe("resolveSuiteAppLabel", () => {
  it("uses t() when the key resolves", () => {
    const t = (key: string) => (key === "suite.apps.music.name" ? "Música" : key);
    assert.equal(resolveSuiteAppLabel(app, t, "name"), "Música");
  });

  it("falls back when t() returns the key", () => {
    const t = (key: string) => key;
    assert.equal(resolveSuiteAppLabel(app, t, "description"), "English fallback");
  });
});

describe("localizeSuiteApp", () => {
  it("localizes name and description", () => {
    const t = (key: string) => {
      if (key === "suite.apps.music.name") return "Música";
      if (key === "suite.apps.music.description") return "Desc PT";
      return key;
    };
    const localized = localizeSuiteApp(app, t);
    assert.equal(localized.name, "Música");
    assert.equal(localized.description, "Desc PT");
  });
});
