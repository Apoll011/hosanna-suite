// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";

import { OnboardingPage } from "@/components/pages/OnboardingPage";

export const metadata: Metadata = { title: "Onboarding" };

export default function Page() {
  return <OnboardingPage />;
}
