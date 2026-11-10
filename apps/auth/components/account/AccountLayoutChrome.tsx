"use client";

import { AccountShell } from "@/components/AccountShell";
import { AccountNav } from "@/components/account/AccountNav";
import { AccountToastProvider, useAccountToast } from "@/components/account/AccountToast";
import { readRedirectParam } from "@/lib/redirect";
import type { ReactNode } from "react";
import { useMemo } from "react";

function AccountLayoutInner({ children }: { children: ReactNode }) {
  const { toast } = useAccountToast();
  const returnUrl = useMemo(() => {
    if (typeof window === "undefined") return null;
    return readRedirectParam(new URLSearchParams(window.location.search));
  }, []);

  return (
    <AccountShell toast={toast} returnUrl={returnUrl}>
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8 lg:gap-10">
        <AccountNav />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </AccountShell>
  );
}

/** Persistent account chrome — shell + nav stay mounted across page switches. */
export function AccountLayoutChrome({ children }: { children: ReactNode }) {
  return (
    <AccountToastProvider>
      <AccountLayoutInner>{children}</AccountLayoutInner>
    </AccountToastProvider>
  );
}
