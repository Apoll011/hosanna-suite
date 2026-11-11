import path from "node:path";
import { fileURLToPath } from "node:url";

import { syncBrandPublic } from "@hosanna/brand/sync-public";
import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

syncBrandPublic(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "public"));

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  // Huge brand SVGs must not enter the precache; keep SW lean for auth.
  exclude: [
    /bimi\.svg$/,
    /hosanna_favicon\.svg$/,
    /favicon\.svg$/,
    /\/api\//,
  ],
  maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
});

const nextConfig: NextConfig = {
  transpilePackages: [
    "@hosanna/auth",
    "@hosanna/brand",
    "@hosanna/chordpro",
    "@hosanna/db",
    "@hosanna/i18n",
    "@hosanna/logos-ai",
    "@hosanna/ui",
    "@hosanna/config",
  ],
  serverExternalPackages: ["handlebars", "pg", "@prisma/client", "@prisma/adapter-pg"],
  experimental: {
    optimizePackageImports: ["lucide-react", "@hosanna/ui"],
  },
  async headers() {
    return [
      {
        source: "/background.webp",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/:file(favicon.png|apple-touch-icon.png|og-image.jpg)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};

export default withSerwist(nextConfig);
