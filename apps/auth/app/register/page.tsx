import type { Metadata } from "next";

import { RegisterPage } from "@/components/pages/RegisterPage";
import { SuspensePage } from "@/components/SuspensePage";

export const metadata: Metadata = { title: "Register" };

export default function Page() {
  return (
    <SuspensePage>
      <RegisterPage />
    </SuspensePage>
  );
}
