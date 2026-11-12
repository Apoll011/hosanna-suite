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

/** POST /api/backup/restore — replace tenant library from JSON export. */
export async function POST(req: Request) {
  try {
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
    assertPermission(ctx, "backup.import");

    const body = await req.json();
    const service = new BackupService(
      forOrganization(ctx.organizationId),
      ctx.organizationId,
      ctx.locale,
    );
    const result = await service.restore(body);
    return Response.json({
      message: t(ctx.locale, "backup.restored_successfully"),
      ...result,
    });
  } catch (err) {
    return jsonError(err);
  }
}
