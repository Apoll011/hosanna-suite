/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * User-level preferences stored in Better Auth `user.metadata` (JSON string)
 * and mirrored in localStorage under {@link PERSONAL_SETTINGS_KEY}.
 *
 * Shared core: theme + language.
 * App-specific prefs live under `apps.<scopeId>` via the scope registry.
 */

/** Matches `@hosanna/i18n` PersonalLanguage without a package edge here. */
export type PersonalLanguage = "pt" | "en" | "es" | "auto";

export type PersonalTheme = "light" | "dark" | "system";

/** Per-app preference blobs keyed by scope id (e.g. `"studio"`). */
export type AppSettingsMap = Record<string, Record<string, unknown>>;

/**
 * Shared personal settings blob (Auth + every suite app).
 * Unknown root keys and unknown `apps.*` scopes are preserved on merge/write.
 */
export interface PersonalSettings {
  /** UI language preference. `"auto"` follows org → browser → default. */
  language: PersonalLanguage;
  theme: PersonalTheme;
  revisedAt?: number;
  apps?: AppSettingsMap;
  [key: string]: unknown;
}

export const PERSONAL_SETTINGS_KEY = "personal-settings";

/** Shared cookie domain so Auth ↔ Studio first-paint the same color scheme. */
export const THEME_COOKIE = "hosanna_color_scheme";

export const DEFAULT_PERSONAL_SETTINGS: PersonalSettings = {
  language: "auto",
  theme: "light",
  apps: {},
};

/** Prefs that must sync across apps/origins via metadata (localStorage is per-origin). */
export const CROSS_APP_KEYS = ["theme", "language"] as const;
export type CrossAppKey = (typeof CROSS_APP_KEYS)[number];
