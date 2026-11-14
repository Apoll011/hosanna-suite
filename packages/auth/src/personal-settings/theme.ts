/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PERSONAL_SETTINGS_KEY, THEME_COOKIE, type PersonalTheme } from "./types.js";

export const THEME_BG = {
  light: "#f4f6f8",
  dark: "#0b0d12",
} as const;

const FALLBACK_MS = 220;

function cookieDomain(): string {
  if (typeof location === "undefined") return "";
  const host = location.hostname;
  if (host === "hosanna.live" || host.endsWith(".hosanna.live")) {
    return "; Domain=.hosanna.live";
  }
  return "";
}

export function writeThemeCookie(mode: PersonalTheme) {
  try {
    document.cookie = `${THEME_COOKIE}=${mode}; Path=/; Max-Age=31536000; SameSite=Lax${cookieDomain()}`;
  } catch {
    /* private mode / cookie blocked */
  }
}

/** Read the shared preference cookie (`light` | `dark` | `system`). */
export function readThemeCookie(): PersonalTheme | null {
  if (typeof document === "undefined") return null;
  try {
    const match = document.cookie.match(
      new RegExp(`(?:^|; )${THEME_COOKIE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`),
    );
    if (!match) return null;
    const value = decodeURIComponent(match[1] ?? "");
    if (value === "light" || value === "dark" || value === "system") return value;
  } catch {
    /* ignore */
  }
  return null;
}

export function resolveDarkMode(theme: PersonalTheme): boolean {
  if (theme === "dark") return true;
  if (theme === "light") return false;
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyDocumentTheme(dark: boolean) {
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
  root.style.backgroundColor = "";
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function runThemeTransition(apply: () => void) {
  if (typeof document === "undefined") {
    apply();
    return;
  }

  if (prefersReducedMotion()) {
    apply();
    return;
  }

  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => { finished: Promise<unknown> };
  };

  if (typeof doc.startViewTransition === "function") {
    try {
      doc.startViewTransition(() => {
        apply();
      });
      return;
    } catch {}
  }

  const root = document.documentElement;
  root.classList.add("theme-transition");
  apply();
  window.setTimeout(() => root.classList.remove("theme-transition"), FALLBACK_MS);
}

/**
 * Inline &lt;head&gt; bootstrap shared by Auth + Studio.
 * Order: personal-settings → optional legacy keys → cookie → light.
 */
export function buildThemeBootScript(opts?: { legacyLocalKeys?: readonly string[] }): string {
  const legacy = JSON.stringify(opts?.legacyLocalKeys ?? []);
  return `(function(){try{var c=${JSON.stringify(THEME_COOKIE)},bg=${JSON.stringify(THEME_BG)},pk=${JSON.stringify(PERSONAL_SETTINGS_KEY)},legacy=${legacy};var theme="light";var raw=localStorage.getItem(pk);if(raw){try{var p=JSON.parse(raw);if(p&&(p.theme==="light"||p.theme==="dark"||p.theme==="system"))theme=p.theme;}catch(e){}}else{for(var i=0;i<legacy.length;i++){var v=localStorage.getItem(legacy[i]);if(v==="light"||v==="dark"||v==="system"){theme=v;break;}}if(theme==="light"){var m=document.cookie.match(new RegExp("(?:^|; )"+c+"=([^;]*)"));if(m){var cv=decodeURIComponent(m[1]);if(cv==="light"||cv==="dark"||cv==="system")theme=cv;}}}var dark=theme==="dark"||(theme==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.toggle("dark",dark);r.style.colorScheme=dark?"dark":"light";r.style.backgroundColor=dark?bg.dark:bg.light;}catch(e){}})();`;
}
