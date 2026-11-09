import type { Metadata } from "next";

import { LoginPage } from "@/components/pages/LoginPage";
import { SuspensePage } from "@/components/SuspensePage";

export const metadata: Metadata = { title: "Login" };

export default function Page() {
  return (
    <SuspensePage>
      <LoginPage />
    </SuspensePage>
  );
}
