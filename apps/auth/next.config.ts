// SPDX-License-Identifier: AGPL-3.0-only
import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  exclude: [/bimi\.svg$/, /hosanna_favicon\.svg$/, /favicon\.svg$/, /\/api\//],
  maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
});

const nextConfig: NextConfig = {
  webpack(config) {
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      ".js": [".ts", ".tsx", ".js"],
    };
    return config;
  },
  transpilePackages: [
    "@hosanna/auth",
    "@hosanna/chordpro",
    "@hosanna/db",
    "@hosanna/i18n",
    "@hosanna/logos-ai",
    "@hosanna/storage",
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
