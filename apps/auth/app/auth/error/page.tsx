import type { Metadata } from "next";

import { AuthErrorPage } from "@/components/pages/AuthErrorPage";
import { SuspensePage } from "@/components/SuspensePage";

export const metadata: Metadata = { title: "Auth error" };

export default function Page() {
  return (
    <SuspensePage>
      <AuthErrorPage />
    </SuspensePage>
  );
}
