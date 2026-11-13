"use client";

import { readCachedActiveOrg } from "@/lib/organization/cache";
import { MESSAGES } from "@/locales/ui";
import {
  DEFAULT_PERSONAL_SETTINGS,
  getPersonalSettings,
  subscribePersonalSettings,
  updatePersonalSettingsSafe,
  type PersonalLanguage,
} from "@hosanna/auth";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_LOCALE,
  resolveLanguage,
  resolveString,
  type Interpolation,
  type Language,
  type TranslationKeyOf,
  type TranslationPluralKeyOf,
} from "@hosanna/i18n";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { authClient } from "@/lib/auth/client";

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

function readOrgLocale(): string | null {
  try {
    const org = readCachedActiveOrg();
    const meta = org?.metadata;
    const obj =
      typeof meta === "string"
        ? (JSON.parse(meta) as Record<string, unknown>)
        : meta && typeof meta === "object"
          ? (meta as Record<string, unknown>)
          : null;
    if (!obj) return null;
    const settings = obj.settings as Record<string, unknown> | undefined;
    const general = settings?.general as Record<string, unknown> | undefined;
    const locale = general?.locale ?? obj.locale;
    return typeof locale === "string" && locale.length > 0 ? locale : null;
  } catch {
    return null;
  }
}

function getPersonalLanguageSnapshot(): PersonalLanguage {
  return getPersonalSettings().language ?? DEFAULT_PERSONAL_SETTINGS.language;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const personalLanguage = useSyncExternalStore(
    subscribePersonalSettings,
    getPersonalLanguageSnapshot,
    () => DEFAULT_PERSONAL_SETTINGS.language,
  );

  const language = useMemo<Language>(() => {
    const browser =
      typeof navigator !== "undefined" ? (navigator.languages ?? navigator.language) : undefined;
    return resolveLanguage(personalLanguage, readOrgLocale(), browser);
  }, [personalLanguage]);

  const setPersonalLanguage = useCallback((lang: PersonalLanguage) => {
    void updatePersonalSettingsSafe(
      { language: lang },
      {
        readRemoteMetadata: async () => {
          const session = await authClient.getSession();
          return (session.data?.user as { metadata?: unknown } | undefined)?.metadata;
        },
      },
    );
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
