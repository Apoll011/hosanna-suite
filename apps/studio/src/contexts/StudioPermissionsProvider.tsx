/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AppRole, PermissionString } from "@hosanna/auth";
import { PermissionsProvider, groupPermissions } from "@hosanna/ui";
import React, { useCallback } from "react";
import { authClient } from "../lib/authClient";
import { useAuth } from "./AuthContext";

/** Bridges Studio AuthContext role + authClient into shared PermissionsProvider. */
export const StudioPermissionsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, isLoading } = useAuth();

  const checkPermissions = useCallback(async (permissions: PermissionString[]) => {
    const { data, error } = await authClient.organization.hasPermission({
      permissions: groupPermissions(permissions) as Record<string, string[]>,
    });
    if (error) throw new Error(error.message ?? "Permission check failed");
    return data?.success ?? false;
  }, []);

  return (
    <PermissionsProvider
      role={(user?.role as AppRole) ?? null}
      roleLoading={isLoading}
      checkPermissions={checkPermissions}
    >
      {children}
    </PermissionsProvider>
  );
};
