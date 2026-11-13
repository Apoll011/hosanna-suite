"use client";

import { HomeShell } from "@/components/home/HomeShell";
import { AccountPermissionsProvider } from "@/components/account/AccountPermissionsProvider";
import { AuthLogosProvider } from "@/components/logos/AuthLogosProvider";
import { ActiveOrganizationProvider } from "@/hooks/useActiveOrganization";
import type { ReactNode } from "react";

/** Providers + header-only chrome for `/home`. */
export function HomeProviders({ children }: { children: ReactNode }) {
  return (
    <ActiveOrganizationProvider>
      <AccountPermissionsProvider>
        <AuthLogosProvider>
          <HomeShell>{children}</HomeShell>
        </AuthLogosProvider>
      </AccountPermissionsProvider>
    </ActiveOrganizationProvider>
  );
}
