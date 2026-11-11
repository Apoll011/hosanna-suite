import { withOauthNavigationRedirect } from "@hosanna/auth/server";
import { auth } from "@/lib/auth/server";

const handler = withOauthNavigationRedirect(auth.handler);

async function handle(request: Request): Promise<Response> {
  return handler(request);
}

export const GET = handle;
export const POST = handle;
