/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  getPersonalSettings,
  resolveDarkMode,
  runThemeTransition,
  syncThemeFromSharedCookie,
  updatePersonalSettingsSafe,
  type PersonalTheme,
} from "@hosanna/auth";
import { usePersonalSettings } from "../hooks/usePersonalSettings";
import { authClient } from "../lib/authClient";
import { applyDocumentTheme, writeThemeCookie } from "../lib/themeBoot";

export type Theme = PersonalTheme;

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyTheme(darkMode: boolean, theme: Theme, animate: boolean) {
  const apply = () => {
    applyDocumentTheme(darkMode);
    writeThemeCookie(theme);
  };
  if (!animate || document.visibilityState === "hidden") {
    apply();
    return;
  }
  runThemeTransition(apply);
}

export const ThemeProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { settings } = usePersonalSettings();
  const theme = settings.theme;
  const mounted = useRef(false);
  const lastApplied = useRef<{ theme: Theme; darkMode: boolean } | null>(null);

  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
  );

  useLayoutEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (e: MediaQueryListEvent) => {
      setSystemDark(e.matches);
    };
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  useEffect(() => {
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

  const setTheme = useCallback((next: Theme) => {
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

  const darkMode = theme === "system" ? systemDark : theme === "dark";

  useLayoutEffect(() => {
    const prev = lastApplied.current;
    if (prev?.theme === theme && prev?.darkMode === darkMode) return;

    const animate = mounted.current;
    if (!mounted.current) mounted.current = true;
    lastApplied.current = { theme, darkMode };
    applyTheme(darkMode, theme, animate);
  }, [darkMode, theme]);

  const toggleDarkMode = useCallback(() => {
    const resolved = resolveDarkMode(getPersonalSettings().theme);
    setTheme(resolved ? "light" : "dark");
  }, [setTheme]);

  const value = useMemo(
    () => ({ theme, setTheme, darkMode, toggleDarkMode }),
    [theme, setTheme, darkMode, toggleDarkMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
