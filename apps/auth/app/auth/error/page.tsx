// SPDX-License-Identifier: AGPL-3.0-only
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
