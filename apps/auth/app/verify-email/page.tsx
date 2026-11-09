import type { Metadata } from "next";

import { VerifyEmailPage } from "@/components/pages/VerifyEmailPage";
import { SuspensePage } from "@/components/SuspensePage";

export const metadata: Metadata = { title: "Verify email" };

export default function Page() {
  return (
    <SuspensePage>
      <VerifyEmailPage />
    </SuspensePage>
  );
}
