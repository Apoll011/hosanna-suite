import type { Metadata } from "next";

import { ResetPasswordPage } from "@/components/pages/ResetPasswordPage";
import { SuspensePage } from "@/components/SuspensePage";

export const metadata: Metadata = { title: "Reset password" };

export default function Page() {
  return (
    <SuspensePage>
      <ResetPasswordPage />
    </SuspensePage>
  );
}
