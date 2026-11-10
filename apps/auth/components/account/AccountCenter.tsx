"use client";

import { useAccountToast } from "@/components/account/AccountToast";
import type { ReactNode } from "react";
import { useEffect } from "react";

/**
 * Thin page helper: forwards page toasts into the layout banner.
 * Shell + nav live in `AccountLayoutChrome` (account layout) so they don't remount.
 */
export function AccountCenter({
  children,
  toast,
}: {
  children: ReactNode;
  toast?: { msg: string; type: "success" | "error" } | null;
  /** @deprecated Layout owns header actions */
  headerActions?: ReactNode;
  /** @deprecated Layout owns returnUrl */
  returnUrl?: string | null;
}) {
  const { showToast, clearToast } = useAccountToast();

  useEffect(() => {
    if (!toast) return;
    showToast(toast.msg, toast.type);
    return () => clearToast();
  }, [toast, showToast, clearToast]);

  return <>{children}</>;
}
