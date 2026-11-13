/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useAuth } from "@/src/contexts/AuthContext";
import { getAuthAppUrl } from "@/src/lib/authUrl";
import { useI18n } from "@/src/lib/i18n";
import { AppSwitcher } from "@hosanna/ui";
import React from "react";

/** Studio-mounted App Switcher — loads catalog from auth `/api/suite/apps`. */
export const StudioAppSwitcher: React.FC = () => {
  const { t } = useI18n();
  const { user } = useAuth();
  const appsUrl = `${getAuthAppUrl()}/api/suite/apps`;

  return (
    <AppSwitcher
      displayName={user?.name || user?.email || ""}
      appsUrl={appsUrl}
      currentAppId="music"
      translate={(key) => t(key as Parameters<typeof t>[0])}
      labels={{
        openMenu: t("suite.switcher.open"),
        greeting: t("suite.switcher.greeting"),
        comingSoon: t("suite.comingSoon"),
        loading: t("suite.switcher.loading"),
        empty: t("suite.switcher.empty"),
        error: t("suite.switcher.error"),
      }}
    />
  );
};
