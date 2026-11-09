import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@hosanna/auth",
    "@hosanna/brand",
    "@hosanna/db",
    "@hosanna/i18n",
    "@hosanna/ui",
    "@hosanna/config",
  ],
};

export default nextConfig;
