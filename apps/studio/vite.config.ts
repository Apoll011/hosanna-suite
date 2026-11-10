import { hosannaBrandPublic } from "@hosanna/brand/vite-plugin";
import preact from "@preact/preset-vite";
import tailwindcss from "@tailwindcss/vite";
import { createRequire } from "node:module";
import path from "path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

/** Resolve a package root from this app, then follow nested peers from that copy. */
function resolvePackageRoot(id: string, from = import.meta.url): string {
  return path.dirname(createRequire(from).resolve(`${id}/package.json`));
}

// Studio is Preact-only (`react`/`react-dom` → `@preact/compat`). Workspace
// packages like `@hosanna/logos-ai` can still pull a second `react-router-dom`
// bound to real React via pnpm. Pin exact package ids (not subpaths) to the
// Preact-compat copy so production keeps a single Router context.
const requireFromStudio = createRequire(import.meta.url);
const reactRouterDomRoot = resolvePackageRoot("react-router-dom");
const reactRouterRoot = resolvePackageRoot(
  "react-router",
  path.join(reactRouterDomRoot, "package.json"),
);
const requireFromReactRouter = createRequire(path.join(reactRouterRoot, "package.json"));
const reactRouterDomEntry = requireFromStudio.resolve("react-router-dom");
const reactRouterEntry = requireFromReactRouter.resolve("react-router");
const reactRouterDomSubpath = requireFromReactRouter.resolve("react-router/dom");

export default defineConfig(() => {
  return {
    plugins: [
      preact(),
      tailwindcss(),
      hosannaBrandPublic(),
      VitePWA({
        registerType: "prompt",
        workbox: {
          maximumFileSizeToCacheInBytes: 4194304,
          cleanupOutdatedCaches: true,
          // Default navigateFallback is index.html — without a denylist, opening
          // /robots.txt or /sitemap.xml in the browser loads the SPA, then the
          // router redirects to /onboarding (looks like a "redirect to home").
          navigateFallback: "index.html",
          navigateFallbackDenylist: [/^\/robots\.txt$/, /^\/sitemap\.xml$/],
          globPatterns: ["**/*.{js,css,html,ico,png,svg,xml,txt}"],
        },
        includeAssets: [
          "favicon.svg",
          "favicon.png",
          "apple-touch-icon.png",
          "apple-touch-icon-180x180.png",
          "apple-touch-icon-167x167.png",
          "apple-touch-icon-152x152.png",
          "hosanna_favicon.svg",
          "robots.txt",
          "sitemap.xml",
        ],
        devOptions: {
          enabled: false,
        },
        manifest: {
          name: "Hosanna Studio",
          short_name: "Hosanna",
          description:
            "Planeie e organize os seus serviços de culto, músicas e setlists de forma simples, rápida e eficiente.",
          theme_color: "#007AFF",
          background_color: "#ffffff",
          display: "standalone",
          icons: [
            {
              src: "apple-touch-icon-180x180.png",
              sizes: "180x180",
              type: "image/png",
            },
            {
              src: "apple-touch-icon-167x167.png",
              sizes: "167x167",
              type: "image/png",
            },
            {
              src: "apple-touch-icon-152x152.png",
              sizes: "152x152",
              type: "image/png",
            },
            {
              src: "apple-touch-icon.png",
              sizes: "192x192",
              type: "image/png",
            },
          ],
        },
      }),
    ],
    resolve: {
      // Exact-id aliases only — string aliases to package roots break subpaths
      // like `react-router/dom`.
      alias: [
        { find: "@", replacement: path.resolve(__dirname, ".") },
        { find: /^react$/, replacement: "preact/compat" },
        { find: /^react-dom$/, replacement: "preact/compat" },
        { find: /^react-dom\/client$/, replacement: "preact/compat" },
        { find: /^react-router-dom$/, replacement: reactRouterDomEntry },
        { find: /^react-router$/, replacement: reactRouterEntry },
        { find: /^react-router\/dom$/, replacement: reactRouterDomSubpath },
      ],
      dedupe: ["preact", "react", "react-dom", "react-router-dom", "react-router"],
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
    },
    define: {
      APP_VERSION: JSON.stringify(process.env.npm_package_version),
    },
    server: {
      hmr: process.env.DISABLE_HMR !== "true",
      watch: process.env.DISABLE_HMR === "true" ? null : {},
    },
  };
});
