/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Spinner } from "@hosanna/ui";
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

    const returnUrl = `${window.location.origin}${location.pathname}${location.search}`;

    if (!isAuthenticated) {
      redirectToAuthApp("/login", { returnUrl });
      return;
    }

    // Only redirect after AuthContext finished a network (or offline) resolve —
    // cached "no org" must not bounce to onboarding before invite/org sync lands.
    if (!organization) {
      redirectToAuthApp("/onboarding", { returnUrl });
      return;
    }

    if (hasAcceptedTrial === false) {
      redirectToAuthApp("/onboarding", { returnUrl });
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
