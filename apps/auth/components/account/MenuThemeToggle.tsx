"use client";

import { MenuThemeToggle as SharedMenuThemeToggle } from "@hosanna/ui";
import { useTheme } from "@/lib/ui/theme";

/** Auth-wired theme switch — shared UI, local theme store. */
export function MenuThemeToggle({ className = "" }: { className?: string }) {
  const { darkMode, toggleDarkMode } = useTheme();
  return (
    <SharedMenuThemeToggle
      className={className}
      darkMode={darkMode}
      onToggle={toggleDarkMode}
    />
  );
}
