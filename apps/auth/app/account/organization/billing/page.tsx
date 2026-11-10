import type { Metadata } from "next";

import { OrgBillingPage } from "@/components/pages/organization/OrgBillingPage";

export const metadata: Metadata = { title: "Billing" };

export default function Page() {
  return <OrgBillingPage />;
}
