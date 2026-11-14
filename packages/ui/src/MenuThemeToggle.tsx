/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Moon, Sun } from "lucide-react";
import React from "react";

import { cn } from "./cn";

export type MenuThemeToggleProps = {
  darkMode: boolean;
  onToggle: () => void;
  className?: string;
  "aria-label"?: string;
};

export const MenuThemeToggle: React.FC<MenuThemeToggleProps> = ({
  darkMode,
  onToggle,
  className = "",
  "aria-label": ariaLabel = "Toggle theme",
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={darkMode}
    aria-label={ariaLabel}
    onClick={onToggle}
    className={cn(
      "relative inline-flex h-7 w-[3.25rem] shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-m3-primary",
      darkMode
        ? "bg-linear-to-r from-indigo-600 to-slate-700 shadow-[inset_0_1px_2px_rgb(0_0_0_/0.35)]"
        : "bg-linear-to-r from-sky-200 to-amber-200 shadow-[inset_0_1px_2px_rgb(0_0_0_/0.08)]",
      className,
    )}
  >
    <Sun
      className={cn(
        "pointer-events-none absolute left-1.5 h-3 w-3 transition-opacity duration-200",
        darkMode ? "opacity-30 text-amber-100/80" : "opacity-90 text-amber-600",
      )}
      aria-hidden
    />
    <Moon
      className={cn(
        "pointer-events-none absolute right-1.5 h-3 w-3 transition-opacity duration-200",
        darkMode ? "opacity-90 text-indigo-100" : "opacity-35 text-slate-500",
      )}
      aria-hidden
    />

    <span
      className={cn(
        "relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-[0_2px_8px_rgb(0_0_0_/0.22)] transition-transform duration-200 ease-out",
        darkMode ? "translate-x-[1.55rem]" : "translate-x-0",
      )}
    >
      <span className="relative h-3.5 w-3.5">
        <Sun
          className={cn(
            "absolute inset-0 h-3.5 w-3.5 text-amber-500 transition-opacity duration-150",
            darkMode ? "opacity-0" : "opacity-100",
          )}
          aria-hidden
        />
        <Moon
          className={cn(
            "absolute inset-0 h-3.5 w-3.5 text-indigo-600 transition-opacity duration-150",
            darkMode ? "opacity-100" : "opacity-0",
          )}
          aria-hidden
        />
      </span>
    </span>
  </button>
);
