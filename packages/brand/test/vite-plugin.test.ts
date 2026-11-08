import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { hosannaBrandPublic } from "../src/vite-plugin.js";

const brandPublic = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../public");

describe("hosannaBrandPublic", () => {
  it("exposes a named Vite plugin with lifecycle hooks", () => {
    const plugin = hosannaBrandPublic() as {
      name: string;
      configResolved?: unknown;
      configureServer?: unknown;
      closeBundle?: unknown;
    };
    assert.equal(plugin.name, "hosanna-brand-public");
    assert.equal(typeof plugin.configResolved, "function");
    assert.equal(typeof plugin.configureServer, "function");
    assert.equal(typeof plugin.closeBundle, "function");
  });

  it("ships required brand assets", () => {
    for (const file of [
      "favicon.svg",
      "favicon.png",
      "hosanna_favicon.svg",
      "apple-touch-icon.png",
      "og-image.jpg",
      "bimi.svg",
    ]) {
      assert.ok(fs.existsSync(path.join(brandPublic, file)), `missing brand asset: ${file}`);
    }
  });

  it("copies brand files into outDir without clobbering existing files", () => {
    const plugin = hosannaBrandPublic() as {
      configResolved: (config: {
        root: string;
        publicDir: string;
        build: { outDir: string };
      }) => void;
      closeBundle: () => void;
    };

    const root = fs.mkdtempSync(path.join(brandPublic, "..", ".tmp-brand-"));
    const outDir = path.join(root, "dist");
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "favicon.svg"), "app-owned");

    try {
      plugin.configResolved({
        root,
        publicDir: path.join(root, "public"),
        build: { outDir: "dist" },
      });
      plugin.closeBundle();

      assert.equal(fs.readFileSync(path.join(outDir, "favicon.svg"), "utf8"), "app-owned");
      assert.ok(fs.existsSync(path.join(outDir, "og-image.jpg")));
      assert.ok(fs.existsSync(path.join(outDir, "apple-touch-icon.png")));
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
