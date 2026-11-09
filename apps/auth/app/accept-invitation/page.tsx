import type { Metadata } from "next";

import { AcceptInvitationPage } from "@/components/pages/AcceptInvitationPage";
import { SuspensePage } from "@/components/SuspensePage";

export const metadata: Metadata = { title: "Accept invitation" };

export default function Page() {
  return (
    <SuspensePage>
      <AcceptInvitationPage />
    </SuspensePage>
  );
}
