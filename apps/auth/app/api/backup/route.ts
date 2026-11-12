import { BackupService } from "@/lib/backup/service";
import { hasActiveSubscription } from "@/lib/billing/entitlement";
import { forOrganization } from "@/lib/db/orgScope";
import {
  AuthHttpError,
  assertPermission,
  jsonError,
  requireAuthSession,
} from "@/lib/notifications/session";
import { t } from "@/locales/server";

async function requireEntitledOrg() {
  const ctx = await requireAuthSession();
  if (!ctx.organizationId) {
    throw new AuthHttpError(403, "An active organization is required.");
  }
  if (!(await hasActiveSubscription(ctx.organizationId))) {
    throw new AuthHttpError(
      402,
      t(ctx.locale, "error.subscription_required"),
      "SUBSCRIPTION_REQUIRED",
    );
  }
  return ctx;
}

/** GET /api/backup — export tenant library JSON. */
export async function GET() {
  try {
    const ctx = await requireEntitledOrg(); //TODO: DO i want an active subscription? Also duplicated code related to requirend orgENtitled
    assertPermission(ctx, "backup.export");
    const service = new BackupService(
      forOrganization(ctx.organizationId!),
      ctx.organizationId!,
      ctx.locale,
    );
    return Response.json(await service.export());
  } catch (err) {
    return jsonError(err);
  }
}
