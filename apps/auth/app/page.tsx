import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/server";

/** Logged-in → account center; guests → login. */
export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  redirect(session?.user ? "/account" : "/login");
}
