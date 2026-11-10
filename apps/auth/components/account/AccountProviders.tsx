"use client";

import { AccountLayoutChrome } from "@/components/account/AccountLayoutChrome";
import { AccountPermissionsProvider } from "@/components/account/AccountPermissionsProvider";
import { ActiveOrganizationProvider } from "@/hooks/useActiveOrganization";
import type { ReactNode } from "react";

/** Client providers + persistent chrome for the `/account` segment. */
export function AccountProviders({ children }: { children: ReactNode }) {
  return (
    <ActiveOrganizationProvider>
      <AccountPermissionsProvider>
        <AccountLayoutChrome>{children}</AccountLayoutChrome>
      </AccountPermissionsProvider>
    </ActiveOrganizationProvider>
  );
}
