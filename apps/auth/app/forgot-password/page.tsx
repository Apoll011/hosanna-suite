import type { Metadata } from "next";

import { ForgotPasswordPage } from "@/components/pages/ForgotPasswordPage";

export const metadata: Metadata = { title: "Forgot password" };

export default function Page() {
  return <ForgotPasswordPage />;
}
