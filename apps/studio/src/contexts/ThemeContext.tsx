/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  getPersonalSettings,
  resolveDarkMode,
  runThemeTransition,
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

export const ThemeProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { settings } = usePersonalSettings();
  const theme = settings.theme;
  const mounted = useRef(false);

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
