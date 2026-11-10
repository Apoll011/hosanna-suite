import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AccountPage } from "@/components/pages/AccountPage";
import { auth } from "@/lib/auth";
import { toCachedUser } from "@/lib/session-cache";

export const metadata: Metadata = { title: "Account" };

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/login?redirect=/account");
  }

  return <AccountPage initialUser={toCachedUser(session.user)} />;
}
