import type { Metadata } from "next";

import { OrgMembersPage } from "@/components/pages/organization/OrgMembersPage";

export const metadata: Metadata = { title: "Members" };

export default function Page() {
  return <OrgMembersPage />;
}
