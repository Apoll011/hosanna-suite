import type { Metadata } from "next";

import { OrgProfilePage } from "@/components/pages/organization/OrgProfilePage";

export const metadata: Metadata = { title: "Organization profile" };

export default function Page() {
  return <OrgProfilePage />;
}
