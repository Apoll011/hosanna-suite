/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { LogosMood } from "../types";

export const MAX_LOOK = 3.4;
export const SLEEP_AFTER_MS = 45_000;
/** Below this the musical extras are dropped so the silhouette stays clean. */
export const COMPACT_BELOW = 56;
/** Hovering this long without leaving counts as petting. */
export const PET_AFTER_MS = 2_000;
/** Rapid pokes escalate: a double-click dances, 4 annoy him, 5 make him dizzy. */
export const GRUMPY_POKES = 4;
export const DIZZY_POKES = 5;
export const POKE_WINDOW_MS = 2_200;
export const DOUBLE_CLICK_MS = 380;
/** Wiggling the pointer back and forth over him tickles. */
export const TICKLE_TURNS = 6;
export const TICKLE_WINDOW_MS = 900;

/** Unprompted behaviours; the CSS keys off `data-act`. */
export type Act =
  | "look"
  | "tilt"
  | "flap"
  | "hop"
  | "stretch"
  | "hum"
  | "ruffle"
  | "peck"
  | "sneeze"
  | "boogie"
  | "cheeky";

export const ACT_MS: Record<Act, number> = {
  look: 2400,
  tilt: 2200,
  flap: 1300,
  hop: 1500,
  stretch: 2500,
  hum: 3300,
  ruffle: 1100,
  peck: 1900,
  sneeze: 1900,
  boogie: 3000,
  cheeky: 1700,
};

export const ALL_ACTS = Object.keys(ACT_MS) as Act[];
export const CALM_ACTS: Act[] = ["look", "tilt", "flap", "peck"];

/** What a poke can turn into (never the same twice in a row). */
export const POKE_REACTIONS: { mood: LogosMood; ms: number }[] = [
  { mood: "surprised", ms: 1300 },
  { mood: "wink", ms: 1800 },
  { mood: "love", ms: 2400 },
  { mood: "excited", ms: 1800 },
  { mood: "happy", ms: 1700 },
  { mood: "singing", ms: 2600 },
  { mood: "shy", ms: 2200 },
  { mood: "cool", ms: 2800 },
];

/** Brand palette (fixed — the mascot looks the same in every theme). */
export const SKY = "#36A9E8";
export const OCEAN = "#168BCB";
export const CYAN = "#8DDAF5";
export const GOLD = "#FFBE45";
export const ORANGE = "#F39A32";
export const INK = "#0E1630";

/** Moods where nothing else is going on, so he is free to fidget. */
export const isResting = (m: LogosMood) => m === "idle" || m === "helping";
/** Moods a poke may interrupt (never real work or an error). */
export const isPokeable = (m: LogosMood) => isResting(m) || m === "happy" || m === "sleeping";

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

export const rand = (min: number, max: number) => min + Math.random() * (max - min);
