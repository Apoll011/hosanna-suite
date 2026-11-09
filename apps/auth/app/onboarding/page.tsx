import type { Metadata } from "next";

import { OnboardingPage } from "@/components/pages/OnboardingPage";

export const metadata: Metadata = { title: "Onboarding" };

export default function Page() {
  return <OnboardingPage />;
}
