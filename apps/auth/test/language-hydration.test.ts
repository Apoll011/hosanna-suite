// SPDX-License-Identifier: AGPL-3.0-only
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveUiLanguage } from "../lib/ui/language";

describe("resolveUiLanguage", () => {
  it("keeps the server and hydration language on the default input", () => {
    assert.equal(
      resolveUiLanguage({
        hydrated: false,
        personalLanguage: "auto",
        orgLocale: "pt-PT",
        browserLocales: ["pt-PT"],
      }),
      "pt",
    );
  });

  it("uses org and browser language after hydration", () => {
    assert.equal(
      resolveUiLanguage({
        hydrated: true,
        personalLanguage: "auto",
        orgLocale: "pt-PT",
        browserLocales: ["es-ES"],
      }),
      "pt",
    );
  });
});
