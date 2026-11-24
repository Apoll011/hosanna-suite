// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";

import { CaptchaPage } from "@/components/pages/CaptchaPage";

export const metadata: Metadata = { title: "Captcha" };

export default function Page() {
  return <CaptchaPage />;
}
