"use client";

import { AccountLayoutChrome } from "@/components/account/AccountLayoutChrome";
import { ActiveOrganizationProvider } from "@/hooks/useActiveOrganization";
import type { ReactNode } from "react";

/** Client providers + persistent chrome for the `/account` segment. */
export function AccountProviders({ children }: { children: ReactNode }) {
  return (
    <ActiveOrganizationProvider>
      <AccountLayoutChrome>{children}</AccountLayoutChrome>
    </ActiveOrganizationProvider>
  );
}
