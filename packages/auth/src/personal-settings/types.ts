/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * User-level preferences stored in Better Auth `user.metadata` (JSON string)
 * and mirrored in localStorage under {@link PERSONAL_SETTINGS_KEY}.
 */

/** Matches `@hosanna/i18n` PersonalLanguage without a package edge here. */
export type PersonalLanguage = "pt" | "en" | "es" | "auto";

export type PersonalTheme = "light" | "dark" | "system";
export type ViewMode = "grid" | "list";
export type ExplorerDensity = "comfortable" | "compact";
export type SongScoreLayout = "ring" | "bar" | "dots" | "badge";

/**
 * Single source of truth for every user-level preference (Studio + Auth).
 * Unknown future keys are preserved via index signature when merging metadata.
 */
export interface PersonalSettings {
  showFolderTree: boolean;
  /** UI language preference. `"auto"` follows org → browser → default. */
  language: PersonalLanguage;
  theme: PersonalTheme;
  showChordsDefault: boolean;
  sidebarCollapsed: boolean;
  viewMode: ViewMode;
  explorerDensity: ExplorerDensity;
  showSongScore: boolean;
  songScoreLayout: SongScoreLayout;
  /**
   * Product tour state.
   * - `null` — legacy user (flag never written) → offer “missed tour” once
   * - `false` — new user / not completed → auto-start when eligible
   * - `true` — finished the product tour
   */
  productTourCompleted: boolean | null;
  /** ISO timestamp when the user dismissed/skipped the product tour offer. */
  productTourDismissedAt: string | null;
  /** Interactive (sandbox) onboarding completed. */
  interactiveOnboardingCompleted: boolean;
  [key: string]: unknown;
}

export const PERSONAL_SETTINGS_KEY = "personal-settings";

/** Shared cookie domain so Auth ↔ Studio first-paint the same color scheme. */
export const THEME_COOKIE = "hosanna_color_scheme";

export const DEFAULT_PERSONAL_SETTINGS: PersonalSettings = {
  showFolderTree: true,
  language: "auto",
  theme: "light",
  showChordsDefault: true,
  sidebarCollapsed: false,
  viewMode: "grid",
  explorerDensity: "comfortable",
  showSongScore: true,
  songScoreLayout: "ring",
  productTourCompleted: null,
  productTourDismissedAt: null,
  interactiveOnboardingCompleted: false,
};

/** New accounts start with an explicit pending tour (not the legacy `null`). */
export const NEW_USER_TOUR_SETTINGS: Pick<
  PersonalSettings,
  "productTourCompleted" | "productTourDismissedAt" | "interactiveOnboardingCompleted"
> = {
  productTourCompleted: false,
  productTourDismissedAt: null,
  interactiveOnboardingCompleted: false,
};

/** Prefs that must sync across apps/origins via metadata (localStorage is per-origin). */
export const CROSS_APP_KEYS = ["theme", "language"] as const;
export type CrossAppKey = (typeof CROSS_APP_KEYS)[number];
