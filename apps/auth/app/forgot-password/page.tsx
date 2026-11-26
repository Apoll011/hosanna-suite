// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";

import { ForgotPasswordPage } from "@/components/pages/ForgotPasswordPage";

export const metadata: Metadata = { title: "Forgot password" };

export default function Page() {
  return <ForgotPasswordPage />;
}
