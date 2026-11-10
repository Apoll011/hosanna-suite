import { NextResponse } from "next/server";

/** RFC 8414: alias bare AS metadata to the Better Auth issuer path. */
export function GET() {
  return NextResponse.redirect(
    new URL(
      "/.well-known/oauth-authorization-server/api/auth",
      process.env.AUTH_URL ?? "http://localhost:5174",
    ),
    302,
  );
}
