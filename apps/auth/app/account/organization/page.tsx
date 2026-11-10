import type { Metadata } from "next";

import { OrgOverviewPage } from "@/components/pages/organization/OrgOverviewPage";

export const metadata: Metadata = { title: "Organization" };

export default function Page() {
  return <OrgOverviewPage />;
}
