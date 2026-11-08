import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const brandDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../public");

function contentType(file: string): string {
  switch (path.extname(file).toLowerCase()) {
    case ".svg":
      return "image/svg+xml";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".ico":
      return "image/x-icon";
    case ".txt":
      return "text/plain; charset=utf-8";
    case ".xml":
      return "application/xml";
    case ".json":
      return "application/json";
    default:
      return "application/octet-stream";
  }
}

function safeBrandFile(urlPath: string): string | null {
  const rel = decodeURIComponent(urlPath.split("?")[0] ?? "").replace(/^\/+/, "");
  if (!rel || rel.includes("..")) return null;
  const file = path.join(brandDir, rel);
  if (!file.startsWith(brandDir + path.sep) && file !== brandDir) return null;
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return null;
  return file;
}

function copyBrandInto(outDir: string): void {
  for (const name of fs.readdirSync(brandDir)) {
    const src = path.join(brandDir, name);
    if (!fs.statSync(src).isFile()) continue;
    const dest = path.join(outDir, name);
    // App-specific public files (robots, sitemap, _routes) win when present.
    if (fs.existsSync(dest)) continue;
    fs.copyFileSync(src, dest);
  }
}

/**
 * Serves / copies shared brand assets from `@hosanna/brand/public`.
 * App `public/` still wins for the same filename (robots, sitemap, etc.).
 *
 * Intentionally untyped against `vite.Plugin` so saas (Vite 8) and studio
 * (Vite 6) do not fight over peer type graphs.
 */
export function hosannaBrandPublic() {
  let outDir = "dist";
  let appPublicDir = "";

  return {
    name: "hosanna-brand-public",
    configResolved(config: { root: string; publicDir: string; build: { outDir: string } }) {
      outDir = path.resolve(config.root, config.build.outDir);
      appPublicDir = config.publicDir ? path.resolve(config.root, config.publicDir) : "";
    },
    configureServer(server: {
      middlewares: {
        use: (fn: (req: any, res: any, next: () => void) => void) => void;
      };
    }) {
      const middleware = (req: any, res: any, next: () => void) => {
        const url: string = req.url ?? "";
        if (url.includes("..")) return next();
        const brandFile = safeBrandFile(url);
        if (!brandFile) return next();
        if (appPublicDir) {
          const appFile = path.join(
            appPublicDir,
            decodeURIComponent(url.split("?")[0] ?? "").replace(/^\/+/, ""),
          );
          if (fs.existsSync(appFile) && fs.statSync(appFile).isFile()) {
            return next();
          }
        }
        res.setHeader("Content-Type", contentType(brandFile));
        fs.createReadStream(brandFile).pipe(res);
      };
      // After Vite's public-dir middleware so app public still wins.
      return () => {
        server.middlewares.use(middleware);
      };
    },
    closeBundle() {
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
      copyBrandInto(outDir);
    },
  };
}
