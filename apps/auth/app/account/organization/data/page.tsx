import type { Metadata } from "next";

import { OrgDataPage } from "@/components/pages/organization/OrgDataPage";

export const metadata: Metadata = { title: "Data" };

export default function Page() {
  return <OrgDataPage />;
}
