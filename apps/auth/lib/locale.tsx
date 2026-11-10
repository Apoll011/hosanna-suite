"use client";

import {
  UI_DICTS,
  type AuthLocale,
  type UiDict,
} from "@/locales/ui";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "hosanna_auth_locale";

type LocaleContextValue = {
  locale: AuthLocale;
  setLocale: (locale: AuthLocale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    key in vars ? String(vars[key]) : `{{${key}}}`,
  );
}

export type { AuthLocale };

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AuthLocale>("en");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as AuthLocale | null;
    if (stored === "en" || stored === "pt") {
      setLocaleState(stored);
      return;
    }
    if (navigator.language.toLowerCase().startsWith("pt")) setLocaleState("pt");
  }, []);

  const setLocale = useCallback((next: AuthLocale) => {
    setLocaleState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const dict = UI_DICTS[locale] ?? UI_DICTS.en;
      const raw = dict[key as keyof UiDict] ?? UI_DICTS.en[key as keyof UiDict] ?? key;
      return interpolate(raw, vars);
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
