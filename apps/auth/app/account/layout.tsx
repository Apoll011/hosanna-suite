import { AccountProviders } from "@/components/account/AccountProviders";
import type { ReactNode } from "react";

/** Account segment — org context wraps every page so hooks can run before AccountCenter. */
export default function AccountLayout({ children }: { children: ReactNode }) {
  return <AccountProviders>{children}</AccountProviders>;
}
