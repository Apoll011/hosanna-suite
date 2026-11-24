// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";

import { OAuthConsentPage } from "@/components/pages/OAuthConsentPage";
import { SuspensePage } from "@/components/SuspensePage";

export const metadata: Metadata = { title: "OAuth consent" };

export default function Page() {
  return (
    <SuspensePage>
      <OAuthConsentPage />
    </SuspensePage>
  );
}
