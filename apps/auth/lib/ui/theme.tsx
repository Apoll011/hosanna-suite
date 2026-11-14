"use client";

import { authClient } from "@/lib/auth/client";
import { applyDocumentTheme } from "@/lib/ui/theme-boot";
import {
  DEFAULT_PERSONAL_SETTINGS,
  getPersonalSettings,
  resolveDarkMode,
  runThemeTransition,
  subscribePersonalSettings,
  syncThemeFromSharedCookie,
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

function applyTheme(darkMode: boolean, theme: PersonalTheme, animate: boolean) {
  const apply = () => {
    applyDocumentTheme(darkMode);
    writeThemeCookie(theme);
  };
  if (!animate || (typeof document !== "undefined" && document.visibilityState === "hidden")) {
    apply();
    return;
  }
  runThemeTransition(apply);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(
    subscribePersonalSettings,
    getSnapshot,
    () => DEFAULT_PERSONAL_SETTINGS.theme,
  );
  const [systemDark, setSystemDark] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : false,
  );
  const mounted = useRef(false);
  const lastApplied = useRef<{ theme: PersonalTheme; darkMode: boolean } | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => setSystemDark(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    syncThemeFromSharedCookie();
    const pullShared = () => {
      syncThemeFromSharedCookie();
    };
    window.addEventListener("focus", pullShared);
    document.addEventListener("visibilitychange", pullShared);
    return () => {
      window.removeEventListener("focus", pullShared);
      document.removeEventListener("visibilitychange", pullShared);
    };
  }, []);

  const darkMode = theme === "system" ? systemDark : theme === "dark";

  useLayoutEffect(() => {
    const prev = lastApplied.current;
    const unchanged = prev?.theme === theme && prev?.darkMode === darkMode;
    if (unchanged) return;

    const animate = mounted.current;
    if (!mounted.current) mounted.current = true;
    lastApplied.current = { theme, darkMode };
    applyTheme(darkMode, theme, animate);
  }, [darkMode, theme]);

  const setTheme = useCallback((next: PersonalTheme) => {
    if (getPersonalSettings().theme === next) return;
    writeThemeCookie(next);
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
