/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
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
