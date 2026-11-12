import { hasActiveSubscription } from "@/lib/billing/entitlement";
import { AuthHttpError, jsonError, requireAuthSession } from "@/lib/notifications/session";

/** GET /api/billing/entitlement — active subscription or trial for the caller's org. */
export async function GET() {
  try {
    const ctx = await requireAuthSession();
    if (!ctx.organizationId) {
      throw new AuthHttpError(403, "An active organization is required.");
    }
    const entitled = await hasActiveSubscription(ctx.organizationId);
    return Response.json({ entitled });
  } catch (err) {
    return jsonError(err);
  }
}
