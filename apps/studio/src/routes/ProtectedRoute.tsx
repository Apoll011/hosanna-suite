/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Spinner } from "@/src/components/common";
import { useI18n } from "@/src/lib/i18n";
import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { isDemoMode } from "../demo/index";
import { redirectToAuthApp } from "../lib/authUrl";

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading, organization, hasAcceptedTrial } = useAuth();
  const location = useLocation();
  const { t } = useI18n();
  const demo = isDemoMode();

  useEffect(() => {
    if (demo || isLoading) return;

    if (!isAuthenticated) {
      redirectToAuthApp("/login", {
        returnUrl: `${window.location.origin}${location.pathname}${location.search}`,
      });
      return;
    }

    if (!organization) {
      redirectToAuthApp("/onboarding", {
        returnUrl: `${window.location.origin}/`,
      });
      return;
    }

    if (hasAcceptedTrial === false) {
      redirectToAuthApp("/onboarding", {
        returnUrl: `${window.location.origin}/`,
      });
    }
  }, [
    demo,
    isLoading,
    isAuthenticated,
    organization,
    hasAcceptedTrial,
    location.pathname,
    location.search,
  ]);

  if (demo) return <Outlet />;

  // `hasAcceptedTrial === null` means "unknown" (fail open) — only block when
  // explicitly false (trial step still required on the auth app).
  if (isLoading || !isAuthenticated || !organization || hasAcceptedTrial === false) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-m3-bg">
        <Spinner size="lg" label={t("common.loading")} />
      </div>
    );
  }

  return <Outlet />;
};
