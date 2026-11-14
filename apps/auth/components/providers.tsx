"use client";

import { SilentPwaUpdater } from "@/components/SilentPwaUpdater";
import { authClient } from "@/lib/auth/client";
import { I18nProvider } from "@/lib/ui/i18n";
import { ThemeProvider } from "@/lib/ui/theme";
import { configurePersonalSettings } from "@hosanna/auth";
import type { ReactNode } from "react";

/** Same key as `lib/session/cache` USER_KEY — keep cached user.metadata warm. */
const CACHED_USER_KEY = "hosanna.auth.cached_user";

if (typeof window !== "undefined") {
  configurePersonalSettings({
    cachedUserKey: CACHED_USER_KEY,
    updateUserMetadata: async (metadataJson) => {
      await (
        authClient.updateUser as unknown as (params: { metadata: string }) => Promise<unknown>
      )({
        metadata: metadataJson,
      });
    },
  });
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <SilentPwaUpdater />
        {children}
      </I18nProvider>
    </ThemeProvider>
  );
}
