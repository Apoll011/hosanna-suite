import { listSuiteApps, type SuiteAppDto, type SuiteAppUrlEnv } from "@hosanna/auth";

import { env } from "@/lib/config/env";

function resolveStudioUrl(): string {
  return (
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_STUDIO_URL) ||
    env.studioUrl ||
    "https://studio.hosanna.live"
  ).replace(/\/+$/, "");
}

/** Build URL env for the suite catalog from auth runtime config. */
export function getSuiteAppUrlEnv(organizationSlug?: string | null): SuiteAppUrlEnv {
  return {
    authOrigin: env.authUrl.replace(/\/+$/, ""),
    studioUrl: resolveStudioUrl(),
    planningUrl: process.env.NEXT_PUBLIC_PLANNING_URL ?? process.env.PLANNING_URL,
    financeUrl: process.env.NEXT_PUBLIC_FINANCE_URL ?? process.env.FINANCE_URL,
    presenterUrl: process.env.NEXT_PUBLIC_PRESENTER_URL ?? process.env.PRESENTER_URL,
    communityUrl: process.env.NEXT_PUBLIC_COMMUNITY_URL ?? process.env.COMMUNITY_URL,
    organizationSlug: organizationSlug ?? null,
  };
}

export function listAuthSuiteApps(organizationSlug?: string | null): SuiteAppDto[] {
  return listSuiteApps(getSuiteAppUrlEnv(organizationSlug));
}
