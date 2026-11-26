// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { AccountLayoutChrome } from "@/components/account/AccountLayoutChrome";
import { AccountPermissionsProvider } from "@/components/account/AccountPermissionsProvider";
import { AuthLogosProvider } from "@/components/logos/AuthLogosProvider";
import { ActiveOrganizationProvider } from "@/hooks/useActiveOrganization";
import type { ReactNode } from "react";

/** Client providers + persistent chrome for the `/account` segment. */
export function AccountProviders({ children }: { children: ReactNode }) {
  return (
    <ActiveOrganizationProvider>
      <AccountPermissionsProvider>
        <AuthLogosProvider>
          <AccountLayoutChrome>{children}</AccountLayoutChrome>
        </AuthLogosProvider>
      </AccountPermissionsProvider>
    </ActiveOrganizationProvider>
  );
}
