import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Absolute path to `@hosanna/brand/public`. */
export const brandPublicDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../public",
);

/**
 * Copy shared brand assets into `targetDir`.
 * Existing files in the target win (app-owned public assets are never overwritten).
 */
export function syncBrandPublic(targetDir: string): void {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  for (const name of fs.readdirSync(brandPublicDir)) {
    const src = path.join(brandPublicDir, name);
    if (!fs.statSync(src).isFile()) continue;
    const dest = path.join(targetDir, name);
    if (fs.existsSync(dest)) continue;
    fs.copyFileSync(src, dest);
  }
}
