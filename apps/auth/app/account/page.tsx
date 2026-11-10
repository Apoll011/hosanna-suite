import type { Metadata } from "next";

import { AccountPage } from "@/components/pages/AccountPage";
import { SuspensePage } from "@/components/SuspensePage";

export const metadata: Metadata = { title: "Account" };

export default function Page() {
  return (
    <SuspensePage>
      <AccountPage />
    </SuspensePage>
  );
}
