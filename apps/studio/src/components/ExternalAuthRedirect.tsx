/**
 * @license
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Spinner } from "@hosanna/ui";
import React, { useEffect } from "react";
import { redirectToAuthApp } from "../lib/authUrl";

/** Sends the browser to the dedicated auth app for legacy Studio auth routes. */
export const ExternalAuthRedirect: React.FC<{ path: string }> = ({ path }) => {
  useEffect(() => {
    redirectToAuthApp(path, {
      preserveSearch: true,
      returnUrl: `${window.location.origin}/`,
    });
  }, [path]);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-m3-bg">
      <Spinner size="lg" />
    </div>
  );
};
