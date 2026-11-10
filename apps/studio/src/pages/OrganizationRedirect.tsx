/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { isDemoMode } from "@/src/demo";
import { navigateToAuthAccount } from "@/src/lib/authUrl";
import React, { useEffect } from "react";
import { Navigate, useParams, useSearchParams } from "react-router-dom";

/** Old Organization tabs that now live on the auth app. */
const AUTH_ORG_TAB_PATHS: Record<string, string> = {
  workspace: "/account/organization/profile",
  members: "/account/organization/members",
  billing: "/account/organization/billing",
  general: "/account/organization/regional",
  loginActivity: "/account/organization/activity",
  notifications: "/account/organization/notifications",
  ai: "/account/organization/ai",
};

/** Old Organization studio content that now lives under Settings. */
const SETTINGS_TAB_REDIRECTS: Record<string, string> = {
  printing: "printing",
  durations: "services",
  responsibilities: "responsibilities",
  services: "services",
};

/**
 * Legacy `/:slug/organization` bookmarks → auth account or Studio Settings.
 * The Organization page itself is removed.
 */
export const OrganizationRedirect: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab");
  const billingSuccess = searchParams.get("billing") === "success";

  useEffect(() => {
    if (isDemoMode()) return;

    if (billingSuccess || tab === "billing") {
      navigateToAuthAccount({
        path: "/account/organization/billing",
        returnUrl: typeof window !== "undefined" ? window.location.href : undefined,
      });
      return;
    }

    if (!tab) return;

    const authPath = AUTH_ORG_TAB_PATHS[tab];
    if (authPath) {
      navigateToAuthAccount({
        path: authPath,
        returnUrl: typeof window !== "undefined" ? window.location.href : undefined,
      });
    }
  }, [tab, billingSuccess]);

  if (!isDemoMode() && (billingSuccess || tab === "billing")) {
    return null;
  }

  if (!isDemoMode() && tab && AUTH_ORG_TAB_PATHS[tab]) {
    return null;
  }

  const settingsTab =
    (tab && SETTINGS_TAB_REDIRECTS[tab]) ||
    (isDemoMode() && tab && AUTH_ORG_TAB_PATHS[tab] ? "app" : "printing");

  if (!slug) {
    return <Navigate to="/" replace />;
  }

  return <Navigate to={`/${slug}/settings?tab=${settingsTab}`} replace />;
};
