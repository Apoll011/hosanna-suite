"use client";

import { AccountShell } from "@/components/AccountShell";
import { AccountNav } from "@/components/account/AccountNav";
import { ActiveOrganizationProvider } from "@/hooks/useActiveOrganization";
import { readRedirectParam } from "@/lib/redirect";
import type { ReactNode } from "react";
import { useMemo } from "react";

/**
 * Account center chrome: header + Personal/Organization nav + content column.
 * Reads returnUrl from the query string (same pattern as AccountPage).
 */
export function AccountCenter({
  children,
  toast,
  headerActions,
  returnUrl: returnUrlProp,
}: {
  children: ReactNode;
  toast?: { msg: string; type: "success" | "error" } | null;
  headerActions?: ReactNode;
  /** Override for tests; defaults to ?redirect / ?returnUrl. */
  returnUrl?: string | null;
}) {
  const returnUrl = useMemo(() => {
    if (returnUrlProp !== undefined) return returnUrlProp;
    if (typeof window === "undefined") return null;
    return readRedirectParam(new URLSearchParams(window.location.search));
  }, [returnUrlProp]);

  return (
    <ActiveOrganizationProvider>
      <AccountShell toast={toast} returnUrl={returnUrl} headerActions={headerActions}>
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8 lg:gap-10">
          <AccountNav />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </AccountShell>
    </ActiveOrganizationProvider>
  );
}
