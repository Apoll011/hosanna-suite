"use client";

import { MenuThemeToggle as SharedMenuThemeToggle } from "@hosanna/ui";
import { useTheme } from "@/lib/ui/theme";

/** Auth-wired theme radiogroup — shared UI, local theme store. */
export function MenuThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  return (
    <SharedMenuThemeToggle className={className} value={theme} onChange={setTheme} />
  );
}
