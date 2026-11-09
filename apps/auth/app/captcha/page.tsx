import type { Metadata } from "next";

import { CaptchaPage } from "@/components/pages/CaptchaPage";

export const metadata: Metadata = { title: "Captcha" };

export default function Page() {
  return <CaptchaPage />;
}
