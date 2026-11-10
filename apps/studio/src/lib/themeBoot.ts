/** Shared cookie so Studio ↔ Auth can agree on color scheme across origins. */
export const THEME_COOKIE = "hosanna_color_scheme";
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

export function writeThemeCookie(mode: "light" | "dark" | "system") {
  try {
    document.cookie = `${THEME_COOKIE}=${mode}; Path=/; Max-Age=31536000; SameSite=Lax${cookieDomain()}`;
  } catch {}
}

export function applyDocumentTheme(dark: boolean) {
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
  root.style.backgroundColor = "";
}

/**
 * Inline <head> bootstrap — keep byte-for-byte logic aligned with index.html.
 * Resolves: personal-settings → legacy chordpro_theme → cookie → default light.
 */
export const STUDIO_THEME_BOOT_SCRIPT = `(function(){try{var c="hosanna_color_scheme",bg={light:"#f4f6f8",dark:"#0b0d12"};var theme="light";var raw=localStorage.getItem("personal-settings");if(raw){try{var p=JSON.parse(raw);if(p&&(p.theme==="light"||p.theme==="dark"||p.theme==="system"))theme=p.theme;}catch(e){}}else{var legacy=localStorage.getItem("chordpro_theme");if(legacy==="light"||legacy==="dark"||legacy==="system")theme=legacy;else{var m=document.cookie.match(/(?:^|; )hosanna_color_scheme=([^;]*)/);if(m){var cv=decodeURIComponent(m[1]);if(cv==="light"||cv==="dark"||cv==="system")theme=cv;}}}var dark=theme==="dark"||(theme==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.toggle("dark",dark);r.style.colorScheme=dark?"dark":"light";r.style.backgroundColor=dark?bg.dark:bg.light;}catch(e){}})();`;
