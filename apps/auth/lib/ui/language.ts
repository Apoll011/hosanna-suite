import type { PersonalLanguage } from "@hosanna/auth";
import { resolveLanguage, type Language } from "@hosanna/i18n";

export type UiLanguageInputs = {
  /** False for the server render and the client hydration render. */
  hydrated: boolean;
  personalLanguage: PersonalLanguage;
  orgLocale?: string | null;
  browserLocales?: readonly string[] | string | null;
};

/**
 * Org locale and browser languages are browser-only, so they are ignored
 * before hydration to keep the first client render identical to the server.
 */
export function resolveUiLanguage({
  hydrated,
  personalLanguage,
  orgLocale = null,
  browserLocales = null,
}: UiLanguageInputs): Language {
  if (!hydrated) return resolveLanguage(personalLanguage, null, null);
  return resolveLanguage(personalLanguage, orgLocale, browserLocales);
}
