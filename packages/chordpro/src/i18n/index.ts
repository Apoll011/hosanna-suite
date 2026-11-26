// SPDX-License-Identifier: AGPL-3.0-only
import { chordProEn } from "./en";
import { chordProEs } from "./es";
import { chordProPt } from "./pt";

export type LintLanguage = "pt" | "en" | "es";
export type ChordProMessages = typeof chordProPt;

export { chordProEn, chordProEs, chordProPt };

export const chordProMessages: Record<LintLanguage, ChordProMessages> = {
  pt: chordProPt,
  en: chordProEn,
  es: chordProEs,
};

export function getChordProMessages(lang?: string): ChordProMessages {
  if (!lang) return chordProPt;
  const lower = lang.toLowerCase();
  if (lower.startsWith("en")) return chordProEn;
  if (lower.startsWith("es")) return chordProEs;
  return chordProPt;
}
