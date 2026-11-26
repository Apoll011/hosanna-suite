// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { AuthPageViewTracker } from "@/components/AuthPageViewTracker";
import { SilentPwaUpdater } from "@/components/SilentPwaUpdater";
import { authAnalytics } from "@/lib/analytics";
import { authClient } from "@/lib/auth/client";
import { I18nProvider } from "@/lib/ui/i18n";
import { ThemeProvider } from "@/lib/ui/theme";
import { AnalyticsProvider } from "@hosanna/analytics";
import { configurePersonalSettings } from "@hosanna/auth";
import type { ReactNode } from "react";

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
    <AnalyticsProvider client={authAnalytics}>
      <ThemeProvider>
        <I18nProvider>
          <SilentPwaUpdater />
          <AuthPageViewTracker />
          {children}
        </I18nProvider>
      </ThemeProvider>
    </AnalyticsProvider>
  );
}
