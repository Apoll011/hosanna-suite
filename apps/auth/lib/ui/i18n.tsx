"use client";

import { MESSAGES } from "@/locales/ui";
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
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "hosanna_auth_language";

export type TranslationKey = TranslationKeyOf<(typeof MESSAGES)["pt"]>;
export type TranslationPluralKey = TranslationPluralKeyOf<(typeof MESSAGES)["pt"]>;
export type TranslateFn = (key: TranslationKey, vars?: Interpolation) => string;

export interface I18nContextValue {
  language: Language;
  personalLanguage: PersonalLanguage;
  /** BCP-47 tag for Intl formatting (e.g. pt-PT). */
  locale: string;
  setPersonalLanguage: (lang: PersonalLanguage) => void;
  t: TranslateFn;
  tc: (key: TranslationPluralKey, count: number, vars?: Interpolation) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [personalLanguage, setPersonalLanguageState] = useState<PersonalLanguage>("auto");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as PersonalLanguage | Language | null;
    if (stored === "pt" || stored === "en" || stored === "es" || stored === "auto") {
      setPersonalLanguageState(stored);
    }
  }, []);

  const language = useMemo<Language>(() => {
    const browser =
      typeof navigator !== "undefined" ? (navigator.languages ?? navigator.language) : undefined;
    return resolveLanguage(personalLanguage, null, browser);
  }, [personalLanguage]);

  const setPersonalLanguage = useCallback((lang: PersonalLanguage) => {
    setPersonalLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }, []);

  const t = useCallback<TranslateFn>(
    (key, vars) => {
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
    (key: TranslationPluralKey, count: number, vars?: Interpolation) => {
      const form = count === 1 ? "one" : "other";
      return t(`${key}.${form}` as TranslationKey, { ...vars, count });
    },
    [t],
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
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within an I18nProvider");
  return ctx;
}
