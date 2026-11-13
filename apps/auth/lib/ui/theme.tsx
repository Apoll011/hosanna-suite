"use client";

import { authClient } from "@/lib/auth/client";
import { applyDocumentTheme } from "@/lib/ui/theme-boot";
import {
  DEFAULT_PERSONAL_SETTINGS,
  getPersonalSettings,
  resolveDarkMode,
  runThemeTransition,
  subscribePersonalSettings,
  updatePersonalSettingsSafe,
  writeThemeCookie,
  type PersonalTheme,
} from "@hosanna/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

type ThemeContextValue = {
  theme: PersonalTheme;
  darkMode: boolean;
  setTheme: (theme: PersonalTheme) => void;
  toggleDarkMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSnapshot() {
  return getPersonalSettings().theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(
    subscribePersonalSettings,
    getSnapshot,
    () => DEFAULT_PERSONAL_SETTINGS.theme,
  );
  const [systemDark, setSystemDark] = useState(false);
  const mounted = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => setSystemDark(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const darkMode = theme === "system" ? systemDark : theme === "dark";

  useLayoutEffect(() => {
    const apply = () => {
      applyDocumentTheme(darkMode);
      writeThemeCookie(theme);
    };
    if (!mounted.current) {
      mounted.current = true;
      apply();
      return;
    }
    runThemeTransition(apply);
  }, [darkMode, theme]);

  const setTheme = useCallback((next: PersonalTheme) => {
    if (getPersonalSettings().theme === next) return;
    void updatePersonalSettingsSafe(
      { theme: next },
      {
        readRemoteMetadata: async () => {
          const session = await authClient.getSession();
          return (session.data?.user as { metadata?: unknown } | undefined)?.metadata;
        },
      },
    );
  }, []);

  const toggleDarkMode = useCallback(() => {
    const resolved = resolveDarkMode(getPersonalSettings().theme);
    setTheme(resolved ? "light" : "dark");
  }, [setTheme]);

  const value = useMemo(
    () => ({ theme, darkMode, setTheme, toggleDarkMode }),
    [theme, darkMode, setTheme, toggleDarkMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
