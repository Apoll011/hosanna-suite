import { withAuthCors, withOauthNavigationRedirect } from "@hosanna/auth/server";
import { auth } from "@/lib/auth";

const handler = withAuthCors(withOauthNavigationRedirect(auth.handler));

async function handle(request: Request): Promise<Response> {
  return handler(request);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
