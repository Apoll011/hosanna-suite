// SPDX-License-Identifier: AGPL-3.0-only
import { withAuthCors } from "@hosanna/auth/server";
import { pricingResponse } from "@/lib/billing/pricing";

/** GET /api/billing/pricing — public plan display amounts from Global Config. */
async function getPricing(_request: Request): Promise<Response> {
  return Response.json(await pricingResponse());
}

const handler = withAuthCors(getPricing);

export const GET = handler;
/** Preflight for the marketing site / other *.hosanna.live origins. */
export const OPTIONS = handler;
