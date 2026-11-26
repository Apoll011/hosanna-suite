// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useAuthUser } from "@/hooks/useAuthUser";
import { useI18n } from "@/lib/ui/i18n";
import { AppSwitcher } from "@hosanna/ui";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";

/** Auth-mounted App Switcher — loads catalog from `/api/suite/apps`. */
export function AuthAppSwitcher({ currentAppId = "auth" }: { currentAppId?: string }) {
  const { language } = useI18n();
  const { organization } = useActiveOrganization();
  const { user } = useAuthUser({ requireAuth: false, loginRedirect: "/login?redirect=/home" });
  return (
    <AppSwitcher
      language={language}
      displayName={user?.name || user?.email || ""}
      appsUrl={"/api/suite/apps?organizationId=" + encodeURIComponent(organization?.id ?? "")}
      homeHubUrl="/home"
      currentAppId={currentAppId}
    />
  );
}
