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
  it("exposes brand + common verbs for every language", () => {
    for (const lang of ["pt", "en", "es"] as const) {
      assert.equal(sharedMessages[lang].brand.name, "Hosanna");
      assert.equal(typeof sharedMessages[lang].common.save, "string");
      assert.equal(typeof sharedMessages[lang].common.loading, "string");
    }
  });
});
