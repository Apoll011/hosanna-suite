import type { Metadata } from "next";

import { TwoFactorPage } from "@/components/pages/TwoFactorPage";
import { SuspensePage } from "@/components/SuspensePage";

export const metadata: Metadata = { title: "Two-factor" };

export default function Page() {
  return (
    <SuspensePage>
      <TwoFactorPage />
    </SuspensePage>
  );
}
