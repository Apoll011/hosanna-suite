/**
 * @license
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useAuth } from "@/src/contexts/AuthContext";
import { getAuthAppUrl } from "@/src/lib/authUrl";
import { useI18n } from "@/src/lib/i18n";
import { AppSwitcher } from "@hosanna/ui";
import React from "react";

/** Studio-mounted App Switcher — loads catalog from auth `/api/suite/apps`. */
export const StudioAppSwitcher: React.FC = () => {
  const { language } = useI18n();
  const { user } = useAuth();
  const authOrigin = getAuthAppUrl();
  const appsUrl = `${authOrigin}/api/suite/apps`;

  return (
    <AppSwitcher
      language={language}
      displayName={user?.name || user?.email || ""}
      appsUrl={appsUrl}
      homeHubUrl={`${authOrigin}/home`}
      currentAppId="music"
    />
  );
};
