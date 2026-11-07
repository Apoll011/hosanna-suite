/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Spinner } from "@/src/components/common";
import { useI18n } from "@/src/lib/i18n";
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { isDemoMode } from "../demo/index";

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading, organization, hasAcceptedTrial } =
    useAuth();
  const location = useLocation();
  const { t } = useI18n();

  // Demo mode — auth is mocked, allow through unconditionally.
  if (isDemoMode()) return <Outlet />;

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-m3-bg">
        <Spinner size="lg" label={t("common.loading")} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If user is authenticated but has no organization, redirect to onboarding
  // unless they are already on the onboarding page
  if (!organization && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  // A brand-new organization that has never accepted a trial / set up billing
  // must finish onboarding before entering the studio. Once a subscription
  // record exists — even if the trial expired or the payment stopped — the
  // org counts as having accepted the trial and is allowed in.
  if (
    organization &&
    hasAcceptedTrial === false &&
    location.pathname !== "/onboarding"
  ) {
    return <Navigate to="/onboarding" replace />;
  }

  // If they have an organization (and billing is set up) but try to access
  // onboarding or root, send them to the app with organization slug
  if (
    organization &&
    hasAcceptedTrial !== false &&
    (location.pathname === "/onboarding" || location.pathname === "/")
  ) {
    return <Navigate to={`/${organization.slug}/folders`} replace />;
  }

  return <Outlet />;
};
