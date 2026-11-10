import type { Metadata } from "next";
import { headers } from "next/headers";

import { AccountPage } from "@/components/pages/AccountPage";
import { auth } from "@/lib/auth";
import { toCachedUser, type CachedAuthUser } from "@/lib/session-cache";

export const metadata: Metadata = { title: "Account" };

export default async function Page() {
  // Soft seed only — never redirect here. Cookie forwarding in RSC can miss
  // the session even when the browser client is signed in; the client hook
  // hydrates from cache / getSession instead.
  let initialUser: CachedAuthUser | null = null;
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user) {
      initialUser = toCachedUser(session.user);
    }
  } catch {
    /* client will resolve */
  }

  return <AccountPage initialUser={initialUser} />;
}
