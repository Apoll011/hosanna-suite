"use client";

import { useAuthUser } from "@/hooks/useAuthUser";
import { useI18n } from "@/lib/ui/i18n";
import { AppSwitcher } from "@hosanna/ui";

/** Auth-mounted App Switcher — loads catalog from `/api/suite/apps`. */
export function AuthAppSwitcher({ currentAppId = "auth" }: { currentAppId?: string }) {
  const { t } = useI18n();
  const { user } = useAuthUser({ requireAuth: false, loginRedirect: "/login?redirect=/home" });

  return (
    <AppSwitcher
      displayName={user?.name || user?.email || ""}
      appsUrl="/api/suite/apps"
      currentAppId={currentAppId}
      labels={{
        openMenu: t("home.switcher.open"),
        greeting: t("home.switcher.greeting"),
        comingSoon: t("home.comingSoon"),
        loading: t("home.switcher.loading"),
        empty: t("home.switcher.empty"),
        error: t("home.switcher.error"),
      }}
    />
  );
}
