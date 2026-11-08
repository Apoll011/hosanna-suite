/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo } from "react";

import { useAuth } from "@/src/contexts/AuthContext";
import { usePersonalSettings } from "@/src/hooks/usePersonalSettings";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_LOCALE,
  resolveLanguage,
  resolveString,
  type Interpolation,
  type Language,
  type PersonalLanguage,
  type TranslationKeyOf,
  type TranslationPluralKeyOf,
} from "@hosanna/i18n";
import { en } from "./locales/en";
import { es } from "./locales/es";
import { pt } from "./locales/pt";

const MESSAGES: Record<Language, typeof pt> = { pt, en, es };

/** Every dot-path that resolves to a translatable string leaf. */
export type TranslationKey = TranslationKeyOf<typeof pt>;
/** Every dot-path that resolves to a plural (`{ one, other }`) node. */
export type TranslationPluralKey = TranslationPluralKeyOf<typeof pt>;
/** The typed `t` function signature. */
export type TranslateFn = (key: TranslationKey, vars?: Interpolation) => string;

export interface I18nContextValue {
  /** Resolved UI language in effect right now. */
  language: Language;
  /** Raw user preference (may be `"auto"`). */
  personalLanguage: PersonalLanguage;
  /** Locale tag (e.g. "pt-PT") for Intl/toLocale* formatting. */
  locale: string;
  setPersonalLanguage: (lang: PersonalLanguage) => void;
  /** Translate a dot-path key with `{var}` interpolation. */
  t: TranslateFn;
  /** Translate a pluralized key (`key.one` / `key.other`) based on `count`. */
  tc: (key: TranslationPluralKey, count: number, vars?: Interpolation) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { organization } = useAuth();
  const { settings, updateSetting } = usePersonalSettings();

  const personalLanguage: PersonalLanguage = settings.language ?? "auto";
  const orgLocale = organization?.metadata?.settings?.general?.locale;

  const language = useMemo<Language>(() => {
    const browser =
      typeof navigator !== "undefined" ? (navigator.languages ?? navigator.language) : undefined;
    return resolveLanguage(personalLanguage, orgLocale, browser);
  }, [personalLanguage, orgLocale]);

  const t = useCallback(
    (key: TranslationKey, vars?: Interpolation): string => {
      const direct = resolveString(MESSAGES[language], key, vars);
      if (direct !== undefined) return direct;

      if (language !== DEFAULT_LANGUAGE) {
        const fallback = resolveString(MESSAGES[DEFAULT_LANGUAGE], key, vars);
        if (fallback !== undefined) return fallback;
      }

      return key;
    },
    [language],
  );

  const tc = useCallback(
    (key: TranslationPluralKey, count: number, vars?: Interpolation): string => {
      const form = count === 1 ? "one" : "other";
      return t(`${key}.${form}` as TranslationKey, { ...vars, count });
    },
    [t],
  );

  const setPersonalLanguage = useCallback(
    (lang: PersonalLanguage) => updateSetting("language", lang),
    [updateSetting],
  );

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      personalLanguage,
      locale: LANGUAGE_LOCALE[language],
      setPersonalLanguage,
      t,
      tc,
    }),
    [language, personalLanguage, setPersonalLanguage, t, tc],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nContextValue => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
};

export type { Interpolation as I18nInterpolation };
