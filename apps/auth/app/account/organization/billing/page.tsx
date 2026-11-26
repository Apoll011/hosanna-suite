// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";

import { OrgBillingPage } from "@/components/pages/organization/OrgBillingPage";

export const metadata: Metadata = { title: "Billing" };

export default function Page() {
  return <OrgBillingPage />;
}
