/**
 * @license
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * Theme first-paint + cookie helpers — shared implementation in `@hosanna/auth`.
 */

import { buildThemeBootScript } from "@hosanna/auth";

export {
  THEME_BG,
  THEME_COOKIE,
  applyDocumentTheme,
  buildThemeBootScript,
  resolveDarkMode,
  runThemeTransition,
  writeThemeCookie,
} from "@hosanna/auth";

export const STUDIO_THEME_BOOT_SCRIPT = buildThemeBootScript({
  legacyLocalKeys: ["chordpro_theme"],
});
