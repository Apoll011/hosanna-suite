import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const CHROME_FILES = [
  "../components/account/AccountLayoutChrome.tsx",
  "../components/account/AccountNav.tsx",
  "../components/home/HomeShell.tsx",
];

function source(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

describe("client chrome search params", () => {
  for (const file of CHROME_FILES) {
    it(`${file} reads the query string only after mount`, () => {
      const code = source(file);

      assert.ok(code.includes("useBrowserSearch"), "chrome must use the hydration-safe hook");
      assert.ok(
        !code.includes("window.location.search"),
        "chrome must not read location.search during render (SSR would disagree)",
      );
      assert.ok(
        !code.includes('typeof window === "undefined"'),
        "chrome must not branch on window during render",
      );
    });
  }
});
