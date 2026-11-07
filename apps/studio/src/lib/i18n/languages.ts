/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Language } from "./types";

export interface LanguageMeta {
  code: Language;
  /** Label in the language itself, e.g. "Português". */
  nativeLabel: string;
  /** Label in English, useful for a fallback description. */
  englishLabel: string;
  flag: string;
}

export const LANGUAGES: LanguageMeta[] = [
  {
    code: "pt",
    nativeLabel: "Português",
    englishLabel: "Portuguese",
    flag: "🇵🇹",
  },
  { code: "en", nativeLabel: "English", englishLabel: "English", flag: "🇬🇧" },
  { code: "es", nativeLabel: "Español", englishLabel: "Spanish", flag: "🇪🇸" },
];

export const DEFAULT_LANGUAGE: Language = "pt";

export function getLanguageMeta(code: Language): LanguageMeta {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}
