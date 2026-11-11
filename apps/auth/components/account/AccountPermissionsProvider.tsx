"use client";

import type { AppRole, PermissionString } from "@hosanna/auth";
import { PermissionsProvider, groupPermissions, usePreloadPermissions } from "@hosanna/ui";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { authClient } from "@/lib/auth/client";
import { useCallback, type ReactNode } from "react";

function PreloadPermissions({ children }: { children: ReactNode }) {
  usePreloadPermissions();
  return <>{children}</>;
}

/** Bridges auth app active-org role + authClient into shared PermissionsProvider. */
export function AccountPermissionsProvider({ children }: { children: ReactNode }) {
  const { activeRole, isLoading } = useActiveOrganization();

  const checkPermissions = useCallback(async (permissions: PermissionString[]) => {
    const { data, error } = await authClient.organization.hasPermission({
      permissions: groupPermissions(permissions) as Record<string, string[]>,
    });
    if (error) throw new Error(error.message ?? "Permission check failed");
    return data?.success ?? false;
  }, []);

  return (
    <PermissionsProvider
      role={(activeRole as AppRole) ?? null}
      roleLoading={isLoading}
      checkPermissions={checkPermissions}
    >
      <PreloadPermissions>{children}</PreloadPermissions>
    </PermissionsProvider>
  );
}
