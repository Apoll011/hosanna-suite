import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { deepMerge } from "../src/merge";
import { sharedMessages } from "../src/messages";

describe("deepMerge", () => {
  it("lets later sources override nested keys", () => {
    const merged = deepMerge(
      { common: { save: "Save", cancel: "Cancel" }, brand: { name: "A" } },
      { common: { save: "Guardar" }, extra: true },
    );
    assert.deepEqual(merged, {
      common: { save: "Guardar", cancel: "Cancel" },
      brand: { name: "A" },
      extra: true,
    });
  });
});

describe("sharedMessages", () => {
  it("exposes brand, common verbs, and cross-app sections", () => {
    for (const lang of ["pt", "en", "es"] as const) {
      const m = sharedMessages[lang];
      assert.equal(m.brand.name, "Hosanna");
      assert.equal(typeof m.common.save, "string");
      assert.equal(typeof m.common.loading, "string");
      assert.equal(typeof m.loginHistory.title, "string");
      assert.equal(typeof m.organization.loginActivity.title, "string");
      assert.equal(typeof m.oauth.consent.allow, "string");
      assert.equal(typeof m.settings.roles.owner, "string");
      assert.equal(typeof m.settings.notifications.title, "string");
    }
  });
});
