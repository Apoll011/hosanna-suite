// SPDX-License-Identifier: AGPL-3.0-only
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/server";

/** Logged-in → suite home; guests → login. */
export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  redirect(session?.user ? "/home" : "/login");
}
