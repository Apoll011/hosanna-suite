"use client";

import { useI18n } from "@/lib/ui/i18n";
import { useTheme } from "@/lib/ui/theme";
import { MenuThemeToggle } from "@hosanna/ui";

/** Auth header theme control — system / light / dark. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();

  return (
    <MenuThemeToggle
      className={`bg-m3-card/75 backdrop-blur-md shadow-xs ${className}`}
      value={theme}
      onChange={setTheme}
      labels={{
        system: t("suite.accountMenu.themeSystem"),
        light: t("suite.accountMenu.themeLight"),
        dark: t("suite.accountMenu.themeDark"),
      }}
    />
  );
}
