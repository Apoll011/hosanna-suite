/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Resolve chrome strings for shared `@hosanna/ui` suite components from
 * `@hosanna/i18n` `sharedMessages`. Hosts pass `language` when reactive;
 * otherwise `document.documentElement.lang` is used.
 */

import {
  DEFAULT_LANGUAGE,
  localeToLanguage,
  resolveString,
  sharedMessages,
  type Interpolation,
  type Language,
} from "@hosanna/i18n";

export function detectUiLanguage(explicit?: Language): Language {
  if (explicit) return explicit;
  if (typeof document !== "undefined") {
    return localeToLanguage(document.documentElement.lang) ?? DEFAULT_LANGUAGE;
  }
  return DEFAULT_LANGUAGE;
}

export function sharedUiT(language?: Language) {
  const lang = detectUiLanguage(language);
  const dict = sharedMessages[lang] ?? sharedMessages[DEFAULT_LANGUAGE];
  const fallback = sharedMessages[DEFAULT_LANGUAGE];
  return (key: string, vars?: Interpolation): string =>
    resolveString(dict, key, vars) ?? resolveString(fallback, key, vars) ?? key;
}

export type { Language, Interpolation };
