/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DEFAULT_LANGUAGE } from "./languages";
import { Language, PersonalLanguage } from "./types";

/**
 * Map an IETF locale tag (e.g. "pt-BR", "en_US", "es-419") to a supported
 * `Language`, or `null` when it is not supported.
 */
export function localeToLanguage(
  locale: string | null | undefined,
): Language | null {
  if (!locale) return null;
  const base = locale.toLowerCase().split(/[-_]/)[0];
  if (base === "pt" || base === "en" || base === "es") return base;
  return null;
}

/**
 * Resolve the effective language using the requested precedence:
 *   1. Explicit user choice (`pt` | `en` | `es`).
 *   2. Organisation language (from `organization.metadata.settings.general.locale`).
 *   3. Browser language(s).
 *   4. Default (`pt`).
 */
export function resolveLanguage(
  personal: PersonalLanguage | undefined,
  orgLocale: string | null | undefined,
  browserLocales: readonly string[] | string | null | undefined,
): Language {
  if (personal && personal !== "auto") return personal;

  const fromOrg = localeToLanguage(orgLocale);
  if (fromOrg) return fromOrg;

  const candidates =
    typeof browserLocales === "string"
      ? [browserLocales]
      : Array.isArray(browserLocales)
        ? browserLocales
        : [];

  for (const candidate of candidates) {
    const fromBrowser = localeToLanguage(candidate);
    if (fromBrowser) return fromBrowser;
  }

  return DEFAULT_LANGUAGE;
}
