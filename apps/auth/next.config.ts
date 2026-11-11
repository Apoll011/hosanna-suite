import path from "node:path";
import { fileURLToPath } from "node:url";

import { syncBrandPublic } from "@hosanna/brand/sync-public";
import type { NextConfig } from "next";

syncBrandPublic(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "public"));

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
};

export default nextConfig;
