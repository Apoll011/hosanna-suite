"use client";

import { ActiveOrganizationProvider } from "@/hooks/useActiveOrganization";
import type { ReactNode } from "react";

/** Client providers for the `/account` segment (org context shared by all pages). */
export function AccountProviders({ children }: { children: ReactNode }) {
  return <ActiveOrganizationProvider>{children}</ActiveOrganizationProvider>;
}
