/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Canonical suite product catalog for auth home, future app switchers, and
 * deep links. Adding an app = one registry entry (+ env URL when it goes live).
 */

import type { SuiteAppId } from "../authorization/domains.js";

export type SuiteAppStatus = "live" | "coming_soon";

/** Env / runtime inputs used to resolve absolute home URLs. */
export type SuiteAppUrlEnv = {
  /** Auth site origin (e.g. https://auth.hosanna.live). */
  authOrigin: string;
  /** Today's Music web (Studio) origin. */
  studioUrl: string;
  planningUrl?: string;
  financeUrl?: string;
  presenterUrl?: string;
  communityUrl?: string;
  /** When set, Music opens `/{slug}` on Studio. */
  organizationSlug?: string | null;
};

export type SuiteAppDefinition = {
  id: SuiteAppId;
  name: string;
  shortName: string;
  description: string;
  /** i18n key for localized name (e.g. suite.apps.music.name). */
  nameKey?: string;
  shortNameKey?: string;
  descriptionKey?: string;
  /** Public path on the auth origin, or absolute URL. */
  logoUrl: string;
  status: SuiteAppStatus;
  sortOrder: number;
  /** Optional CSS color hint for tiles / switcher chrome. */
  accent?: string;
  categories?: readonly string[];
};

export type SuiteAppDto = {
  id: SuiteAppId;
  name: string;
  shortName: string;
  description: string;
  nameKey?: string;
  shortNameKey?: string;
  descriptionKey?: string;
  logoUrl: string;
  /** Absolute or same-origin path; null when the app is not openable yet. */
  homeUrl: string | null;
  status: SuiteAppStatus;
  sortOrder: number;
  accent?: string;
  categories?: string[];
  /**
   * Hook for future app-role / entitlement filtering.
   * v1: true for live apps, false for coming_soon.
   */
  accessible: boolean;
};

function appKeys(id: SuiteAppId): Pick<SuiteAppDefinition, "nameKey" | "shortNameKey" | "descriptionKey"> {
  if (id === "platform") {
    return {
      nameKey: "suite.apps.auth.name",
      shortNameKey: "suite.apps.auth.shortName",
      descriptionKey: "suite.apps.auth.description",
    };
  }
  return {
    nameKey: `suite.apps.${id}.name`,
    shortNameKey: `suite.apps.${id}.shortName`,
    descriptionKey: `suite.apps.${id}.description`,
  };
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

/**
 * Static product registry. Account (`auth`) and Music are live today;
 * Music still launches on the Studio origin until the Music rename ships.
 */
export const SUITE_APP_REGISTRY: readonly SuiteAppDefinition[] = [
  {
    id: "auth",
    name: "Account",
    shortName: "Account",
    description: "Profile, organization, billing, and security.",
    ...appKeys("auth"),
    logoUrl: "/favicon.png",
    status: "live",
    sortOrder: 10,
    accent: "#64748b",
    categories: ["platform"],
  },
  {
    id: "music",
    name: "Music",
    shortName: "Music",
    description: "Songs, collections, ChordPro charts, and stage tools.",
    ...appKeys("music"),
    logoUrl: "/favicon.png",
    status: "live",
    sortOrder: 20,
    accent: "#2563eb",
    categories: ["worship"],
  },
  {
    id: "planning",
    name: "Planning",
    shortName: "Planning",
    description: "Services, events, teams, rooms, and resources.",
    ...appKeys("planning"),
    logoUrl: "/favicon.png",
    status: "coming_soon",
    sortOrder: 30,
    accent: "#059669",
    categories: ["operations"],
  },
  {
    id: "presenter",
    name: "Presenter",
    shortName: "Presenter",
    description: "Booth show control, lyrics, media, and stream feed.",
    ...appKeys("presenter"),
    logoUrl: "/favicon.png",
    status: "coming_soon",
    sortOrder: 40,
    accent: "#d97706",
    categories: ["worship"],
  },
  {
    id: "community",
    name: "Community",
    shortName: "Community",
    description: "People, posts, sermons, forms, prayer, and check-in.",
    ...appKeys("community"),
    logoUrl: "/favicon.png",
    status: "coming_soon",
    sortOrder: 50,
    accent: "#7c3aed",
    categories: ["people"],
  },
  {
    id: "finance",
    name: "Finance",
    shortName: "Finance",
    description: "Giving, funds, budgets, expenses, and statements.",
    ...appKeys("finance"),
    logoUrl: "/favicon.png",
    status: "coming_soon",
    sortOrder: 60,
    accent: "#0d9488",
    categories: ["stewardship"],
  },
] as const;

function resolveHomeUrl(app: SuiteAppDefinition, env: SuiteAppUrlEnv): string | null {
  const authOrigin = stripTrailingSlash(env.authOrigin);
  const studioUrl = stripTrailingSlash(env.studioUrl);
  const slug = env.organizationSlug?.trim() || null;

  switch (app.id) {
    case "auth":
      return `${authOrigin}/account`;
    case "music":
      return slug ? `${studioUrl}/${slug}` : studioUrl;
    case "planning":
      return env.planningUrl ? stripTrailingSlash(env.planningUrl) : null;
    case "finance":
      return env.financeUrl ? stripTrailingSlash(env.financeUrl) : null;
    case "presenter":
      return env.presenterUrl ? stripTrailingSlash(env.presenterUrl) : null;
    case "community":
      return env.communityUrl ? stripTrailingSlash(env.communityUrl) : null;
    case "platform":
      return `${authOrigin}/account`;
    default:
      return null;
  }
}

function resolveLogoUrl(logoUrl: string, authOrigin: string): string {
  if (logoUrl.startsWith("http://") || logoUrl.startsWith("https://")) return logoUrl;
  const path = logoUrl.startsWith("/") ? logoUrl : `/${logoUrl}`;
  return `${stripTrailingSlash(authOrigin)}${path}`;
}

/** Resolve the catalog into DTOs for HTTP / UI consumers. */
export function listSuiteApps(env: SuiteAppUrlEnv): SuiteAppDto[] {
  return [...SUITE_APP_REGISTRY]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((app) => {
      const homeUrl = resolveHomeUrl(app, env);
      const live = app.status === "live" && Boolean(homeUrl);
      return {
        id: app.id,
        name: app.name,
        shortName: app.shortName,
        description: app.description,
        nameKey: app.nameKey,
        shortNameKey: app.shortNameKey,
        descriptionKey: app.descriptionKey,
        logoUrl: resolveLogoUrl(app.logoUrl, env.authOrigin),
        homeUrl,
        status: app.status,
        sortOrder: app.sortOrder,
        accent: app.accent,
        categories: app.categories ? [...app.categories] : undefined,
        accessible: live,
      };
    });
}

/** Look up a single resolved app, or null. */
export function getSuiteApp(id: SuiteAppId, env: SuiteAppUrlEnv): SuiteAppDto | null {
  return listSuiteApps(env).find((app) => app.id === id) ?? null;
}

/** Convenience: resolved home URL for an app id. */
export function getSuiteAppUrl(id: SuiteAppId, env: SuiteAppUrlEnv): string | null {
  return getSuiteApp(id, env)?.homeUrl ?? null;
}
