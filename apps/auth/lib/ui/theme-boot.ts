/** Shared cookie so Studio ↔ Auth can agree on color scheme across origins. */
export const THEME_COOKIE = "hosanna_color_scheme";
export const THEME_STORAGE_KEY = "hosanna_auth_theme";

export const THEME_BG = {
  light: "#f4f6f8",
  dark: "#0b0d12",
} as const;

function cookieDomain(): string {
  if (typeof location === "undefined") return "";
  const host = location.hostname;
  if (host === "hosanna.live" || host.endsWith(".hosanna.live")) {
    return "; Domain=.hosanna.live";
  }
  return "";
}

/** Persist resolved preference for cross-app first paint (auth ↔ studio). */
export function writeThemeCookie(mode: "light" | "dark" | "system") {
  try {
    document.cookie = `${THEME_COOKIE}=${mode}; Path=/; Max-Age=31536000; SameSite=Lax${cookieDomain()}`;
  } catch {
    /* private mode / cookie blocked */
  }
}

/**
 * Inline <head> bootstrap — runs before first paint.
 * Keep in sync with suite/apps/studio/index.html theme boot.
 */
export const AUTH_THEME_BOOT_SCRIPT = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)},c=${JSON.stringify(THEME_COOKIE)},bg=${JSON.stringify(THEME_BG)};var stored=localStorage.getItem(k);var mode=stored==="dark"||stored==="light"?stored:null;if(!mode){var m=document.cookie.match(new RegExp("(?:^|; )"+c+"=([^;]*)"));mode=m?decodeURIComponent(m[1]):null;}var dark=mode==="dark"||(mode!=="light"&&(!mode||mode==="system")&&window.matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.toggle("dark",dark);r.style.colorScheme=dark?"dark":"light";r.style.backgroundColor=dark?bg.dark:bg.light;}catch(e){}})();`;
