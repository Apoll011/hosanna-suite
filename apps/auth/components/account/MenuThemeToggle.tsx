"use client";

import { useI18n } from "@/lib/ui/i18n";
import { useTheme } from "@/lib/ui/theme";
import { MenuThemeToggle as SharedMenuThemeToggle } from "@hosanna/ui";

export function MenuThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const { language } = useI18n();
  return (
    <SharedMenuThemeToggle
      className={className}
      language={language}
      value={theme}
      onChange={setTheme}
    />
  );
}
