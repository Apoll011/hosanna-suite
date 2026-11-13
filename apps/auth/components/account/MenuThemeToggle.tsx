"use client";

import { useTheme } from "@/lib/ui/theme";
import { Moon, Sun } from "lucide-react";

/**
 * Compact iOS-style theme switch for the account menu — sliding knob with
 * sun/moon crossfade (not the header circular button).
 */
export function MenuThemeToggle({ className = "" }: { className?: string }) {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={darkMode}
      aria-label="Toggle theme"
      onClick={toggleDarkMode}
      className={`relative inline-flex h-7 w-[3.25rem] shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-m3-primary ${
        darkMode
          ? "bg-linear-to-r from-indigo-600 to-slate-700 shadow-[inset_0_1px_2px_rgb(0_0_0_/0.35)]"
          : "bg-linear-to-r from-sky-200 to-amber-200 shadow-[inset_0_1px_2px_rgb(0_0_0_/0.08)]"
      } ${className}`}
    >
      {/* Track glyphs */}
      <Sun
        className={`pointer-events-none absolute left-1.5 h-3 w-3 transition-opacity duration-300 ${
          darkMode ? "opacity-30 text-amber-100/80" : "opacity-90 text-amber-600"
        }`}
        aria-hidden
      />
      <Moon
        className={`pointer-events-none absolute right-1.5 h-3 w-3 transition-opacity duration-300 ${
          darkMode ? "opacity-90 text-indigo-100" : "opacity-35 text-slate-500"
        }`}
        aria-hidden
      />

      {/* Knob */}
      <span
        className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-[0_2px_8px_rgb(0_0_0_/0.22)] transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          darkMode ? "translate-x-[1.55rem]" : "translate-x-0"
        }`}
      >
        <span className="relative h-3.5 w-3.5">
          <Sun
            className={`absolute inset-0 h-3.5 w-3.5 text-amber-500 transition-all duration-400 ${
              darkMode
                ? "rotate-90 scale-50 opacity-0"
                : "rotate-0 scale-100 opacity-100"
            }`}
            aria-hidden
          />
          <Moon
            className={`absolute inset-0 h-3.5 w-3.5 text-indigo-600 transition-all duration-400 ${
              darkMode
                ? "rotate-0 scale-100 opacity-100"
                : "-rotate-90 scale-50 opacity-0"
            }`}
            aria-hidden
          />
        </span>
      </span>
    </button>
  );
}
