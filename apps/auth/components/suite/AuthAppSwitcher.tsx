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
      homeHubUrl="/home"
      currentAppId={currentAppId}
      translate={(key) => t(key as Parameters<typeof t>[0])}
      labels={{
        openMenu: t("suite.switcher.open"),
        greeting: t("suite.switcher.greeting"),
        comingSoon: t("suite.comingSoon"),
        loading: t("suite.switcher.loading"),
        empty: t("suite.switcher.empty"),
        error: t("suite.switcher.error"),
        goHome: t("suite.switcher.goHome"),
      }}
    />
  );
}
