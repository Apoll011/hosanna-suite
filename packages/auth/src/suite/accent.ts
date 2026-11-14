/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Per-app accent tokens derived from {@link SUITE_APP_REGISTRY}.
 * Host apps set CSS variables once; `@hosanna/ui` already reads `--m3-primary*`.
 */

import type { SuiteAppId } from "../authorization/domains.js";
import { SUITE_APP_REGISTRY } from "./apps.js";

const FALLBACK_ACCENT = "#0284c7";

export type SuiteAppBrandTokens = {
  accent: string;
  /** Pressed / darker. */
  accentDark: string;
  /** Soft tint (chips, nav active wash). */
  accentSoft: string;
  /** Brighter accent (optional highlights). */
  accentBright: string;
  /** Primary on dark surfaces. */
  accentOnDark: string;
  accentOnDarkSoft: string;
  accentOnDarkPressed: string;
};

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace("#", "").trim();
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  if (full.length !== 6) return [2, 132, 199];
  return [
    Number.parseInt(full.slice(0, 2), 16),
    Number.parseInt(full.slice(2, 4), 16),
    Number.parseInt(full.slice(4, 6), 16),
  ];
}

function toHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((n) => clampByte(n).toString(16).padStart(2, "0")).join("")}`;
}

function mix(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** Build light/dark brand shades from a single registry accent hex. */
export function brandTokensFromAccent(accent: string): SuiteAppBrandTokens {
  const base = parseHex(accent);
  const white: [number, number, number] = [255, 255, 255];
  const black: [number, number, number] = [0, 0, 0];
  const soft = mix(base, white, 0.88);
  const dark = mix(base, black, 0.18);
  const bright = mix(base, white, 0.28);
  const onDark = mix(base, white, 0.35);
  const onDarkSoft = mix(base, black, 0.72);
  const onDarkPressed = mix(base, white, 0.18);
  return {
    accent: toHex(...base),
    accentDark: toHex(...dark),
    accentSoft: toHex(...soft),
    accentBright: toHex(...bright),
    accentOnDark: toHex(...onDark),
    accentOnDarkSoft: toHex(...onDarkSoft),
    accentOnDarkPressed: toHex(...onDarkPressed),
  };
}

export function getSuiteAppAccent(id: SuiteAppId): string {
  return SUITE_APP_REGISTRY.find((app) => app.id === id)?.accent ?? FALLBACK_ACCENT;
}

export function getSuiteAppBrandTokens(id: SuiteAppId): SuiteAppBrandTokens {
  return brandTokensFromAccent(getSuiteAppAccent(id));
}

/** CSS custom properties consumed by app globals / `@hosanna/ui`. */
export function suiteAppAccentCssVars(id: SuiteAppId): Record<string, string> {
  const t = getSuiteAppBrandTokens(id);
  return {
    "--brand-500": t.accent,
    "--brand-600": t.accentDark,
    "--brand-400": t.accentBright,
    "--brand-100": t.accentSoft,
    "--m3-primary": t.accent,
    "--m3-primary-dark": t.accentDark,
    "--m3-primary-light": t.accentSoft,
  };
}

export function suiteAppAccentDarkCssVars(id: SuiteAppId): Record<string, string> {
  const t = getSuiteAppBrandTokens(id);
  return {
    "--m3-primary": t.accentOnDark,
    "--m3-primary-dark": t.accentOnDarkPressed,
    "--m3-primary-light": t.accentOnDarkSoft,
  };
}

/** Inline `style` attribute for `<html>` first paint (Auth layout, etc.). */
export function suiteAppAccentStyle(id: SuiteAppId): string {
  return Object.entries(suiteAppAccentCssVars(id))
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
}

/** Apply accent tokens on a DOM element (client apps). */
export function applySuiteAppAccent(
  id: SuiteAppId,
  el: HTMLElement = document.documentElement,
  opts?: { dark?: boolean },
): void {
  const light = suiteAppAccentCssVars(id);
  for (const [k, v] of Object.entries(light)) {
    el.style.setProperty(k, v);
  }
  if (opts?.dark ?? el.classList.contains("dark")) {
    for (const [k, v] of Object.entries(suiteAppAccentDarkCssVars(id))) {
      el.style.setProperty(k, v);
    }
  }
}
