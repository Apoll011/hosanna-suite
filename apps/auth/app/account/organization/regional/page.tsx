// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";

import { OrgRegionalPage } from "@/components/pages/organization/OrgRegionalPage";

export const metadata: Metadata = { title: "Regional" };

export default function Page() {
  return <OrgRegionalPage />;
}
