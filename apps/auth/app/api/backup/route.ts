// SPDX-License-Identifier: AGPL-3.0-only
import { BackupService } from "@/lib/backup/service";
import { forOrganization } from "@/lib/db/orgScope";
import { requireExportRateLimit } from "@/lib/privacy/exportRateLimit";
import {
  AuthHttpError,
  assertPermission,
  jsonError,
  requireAuthSession,
} from "@/lib/notifications/session";

export async function GET() {
  try {
    const ctx = await requireAuthSession();
    if (!ctx.organizationId) {
      throw new AuthHttpError(403, "An active organization is required.");
    }
    assertPermission(ctx, "backup.export");
    await requireExportRateLimit(ctx.userId, "organization");
    const service = new BackupService(
      forOrganization(ctx.organizationId),
      ctx.organizationId,
      ctx.locale,
    );
    return Response.json(await service.export(), {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": 'attachment; filename="hosanna-organization-export.json"',
      },
    });
  } catch (err) {
    return jsonError(err);
  }
}
