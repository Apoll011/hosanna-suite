// SPDX-License-Identifier: AGPL-3.0-only
import { withAuthCors, withOauthNavigationRedirect } from "@hosanna/auth/server";
import { auth } from "@/lib/auth/server";
import { withRequestMetrics } from "@/lib/performance/requestMetrics";

const handler = withAuthCors(withOauthNavigationRedirect(auth.handler));

async function handle(request: Request): Promise<Response> {
  return withRequestMetrics(request, "/api/auth/[...all]", () => handler(request));
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
