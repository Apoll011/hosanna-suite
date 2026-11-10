/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import type { AppRole, PermissionString } from "@hosanna/auth";
import React, { createContext, useContext, useMemo, type ReactNode } from "react";

export interface PermissionsProviderProps {
  role: AppRole | null;
  roleLoading: boolean;
  /** Remote check used when local role table can't decide */
  checkPermissions: (permissions: PermissionString[]) => Promise<boolean>;
  children: ReactNode;
}

export interface PermissionsContextValue {
  role: AppRole | null;
  roleLoading: boolean;
  checkPermissions: (permissions: PermissionString[]) => Promise<boolean>;
}

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

export function PermissionsProvider({
  role,
  roleLoading,
  checkPermissions,
  children,
}: PermissionsProviderProps) {
  const value = useMemo(
    () => ({ role, roleLoading, checkPermissions }),
    [role, roleLoading, checkPermissions],
  );

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
}

export function usePermissionsContext(): PermissionsContextValue {
  const ctx = useContext(PermissionsContext);
  if (!ctx) {
    throw new Error("usePermissionsContext must be used within a PermissionsProvider");
  }
  return ctx;
}
