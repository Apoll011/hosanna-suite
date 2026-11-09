"use client";

import { LocaleProvider } from "@/lib/locale";
import { ThemeProvider } from "@/lib/theme";
import type { ReactNode } from "react";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LocaleProvider>{children}</LocaleProvider>
    </ThemeProvider>
  );
}
