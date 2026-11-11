"use client";

import { I18nProvider } from "@/lib/ui/i18n";
import { ThemeProvider } from "@/lib/ui/theme";
import type { ReactNode } from "react";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>{children}</I18nProvider>
    </ThemeProvider>
  );
}
