import { pricingResponse } from "@/lib/billing/pricing";

/** GET /api/billing/pricing — public plan display amounts. */
export async function GET() {
  return Response.json(pricingResponse());
}
