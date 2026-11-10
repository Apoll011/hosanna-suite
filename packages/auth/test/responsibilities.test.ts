import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { RESPONSIBILITIES } from "../src/index.js";

const LOCALES = ["pt-PT", "en", "es"] as const;
const REQUIRED = ["id", "label", "icon", "color"] as const;

describe("RESPONSIBILITIES", () => {
  it("exposes the same ids across pt-PT / en / es", () => {
    const idSets = LOCALES.map((locale) => RESPONSIBILITIES[locale].map((r) => r.id));
    assert.deepEqual(idSets[0], idSets[1]);
    assert.deepEqual(idSets[0], idSets[2]);
  });

  it("keeps ids unique within each locale", () => {
    for (const locale of LOCALES) {
      const ids = RESPONSIBILITIES[locale].map((r) => r.id);
      assert.equal(new Set(ids).size, ids.length, `duplicate ids in ${locale}`);
    }
  });

  it("requires id, label, icon, and color on every entry", () => {
    for (const locale of LOCALES) {
      assert.ok(RESPONSIBILITIES[locale].length > 0);
      for (const entry of RESPONSIBILITIES[locale]) {
        for (const field of REQUIRED) {
          assert.equal(typeof entry[field], "string");
          assert.ok(entry[field].length > 0, `${locale}.${entry.id}.${field}`);
        }
      }
    }
  });
});
