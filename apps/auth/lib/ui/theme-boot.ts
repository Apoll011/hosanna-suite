/**
 * Auth theme boot — shared cookie + personal-settings via `@hosanna/auth`.
 */

import { buildThemeBootScript } from "@hosanna/auth";

export {
  THEME_BG,
  THEME_COOKIE,
  PERSONAL_SETTINGS_KEY,
  applyDocumentTheme,
  buildThemeBootScript,
  resolveDarkMode,
  runThemeTransition,
  writeThemeCookie,
} from "@hosanna/auth";

/** @deprecated Prefer personal-settings.theme; still read by boot for one release. */
export const THEME_STORAGE_KEY = "hosanna_auth_theme";

/** Blocking &lt;head&gt; script for auth layout. */
export const AUTH_THEME_BOOT_SCRIPT = buildThemeBootScript({
  legacyLocalKeys: ["hosanna_auth_theme", "chordpro_theme"],
});
