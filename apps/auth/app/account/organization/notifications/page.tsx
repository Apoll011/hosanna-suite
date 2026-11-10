import type { Metadata } from "next";

import { OrgNotificationsPage } from "@/components/pages/organization/OrgNotificationsPage";

export const metadata: Metadata = { title: "Notifications" };

export default function Page() {
  return <OrgNotificationsPage />;
}
