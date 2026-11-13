import { prisma } from "@/lib/db/prisma";
import { AuthHttpError, jsonError, requireAuthSession } from "@/lib/notifications/session";
import { listAuthSuiteApps } from "@/lib/suite/apps";

/** GET /api/suite/apps — suite product catalog for home + App Switcher. */
export async function GET() {
  try {
    const ctx = await requireAuthSession();

    let organizationSlug: string | null = null;
    if (ctx.organizationId) {
      const org = await prisma.organization.findUnique({
        where: { id: ctx.organizationId },
        select: { slug: true },
      });
      organizationSlug = org?.slug ?? null;
    }

    const apps = listAuthSuiteApps(organizationSlug);
    return Response.json({ apps });
  } catch (err) {
    if (!(err instanceof AuthHttpError)) {
      console.error("[suite/apps]", err);
    }
    return jsonError(err);
  }
}
