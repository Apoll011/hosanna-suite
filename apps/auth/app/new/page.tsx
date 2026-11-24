// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";

import { NewOrganizationPage } from "@/components/pages/NewOrganizationPage";

export const metadata: Metadata = { title: "New organization" };

export default function Page() {
  return <NewOrganizationPage />;
}
