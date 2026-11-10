import type { Metadata } from "next";

import { OrgActivityPage } from "@/components/pages/organization/OrgActivityPage";

export const metadata: Metadata = { title: "Activity" };

export default function Page() {
  return <OrgActivityPage />;
}
