import { pricingResponse } from "@/lib/billing/pricing";

/** GET /api/billing/pricing — public plan display amounts from Global Config. */
export async function GET() {
  return Response.json(await pricingResponse());
}
