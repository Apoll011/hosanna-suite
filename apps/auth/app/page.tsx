import { redirect } from "next/navigation";

/**
 * Root entry — session-aware redirect will land on `/account` or `/login`.
 * Until Better Auth is mounted, always send visitors to login.
 */
export default function HomePage() {
  redirect("/login");
}
