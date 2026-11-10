import type { Metadata } from "next";

import { OrgAiPage } from "@/components/pages/organization/OrgAiPage";

export const metadata: Metadata = { title: "AI" };

export default function Page() {
  return <OrgAiPage />;
}
