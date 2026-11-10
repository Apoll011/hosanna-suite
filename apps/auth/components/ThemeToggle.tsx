"use client";

import { useTheme } from "@/lib/theme";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleDarkMode}
      aria-label="Toggle theme"
      className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-m3-border/60 text-m3-secondary transition-all active:scale-95 ${className}`}
    >
      {darkMode ? (
        <Sun className="h-4 w-4 text-amber-300" />
      ) : (
        <Moon className="h-4 w-4 text-m3-secondary" />
      )}
    </button>
  );
}
