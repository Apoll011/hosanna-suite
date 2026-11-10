import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { brandPublicDir, syncBrandPublic } from "../src/sync-public.js";

describe("syncBrandPublic", () => {
  it("points brandPublicDir at the package public folder", () => {
    assert.ok(fs.existsSync(path.join(brandPublicDir, "favicon.svg")));
  });

  it("copies missing brand files without overwriting existing ones", () => {
    const root = fs.mkdtempSync(
      path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".tmp-sync-"),
    );
    try {
      fs.writeFileSync(path.join(root, "favicon.svg"), "keep-me");
      syncBrandPublic(root);
      assert.equal(fs.readFileSync(path.join(root, "favicon.svg"), "utf8"), "keep-me");
      assert.ok(fs.existsSync(path.join(root, "og-image.jpg")));
      assert.ok(fs.existsSync(path.join(root, "apple-touch-icon.png")));
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
