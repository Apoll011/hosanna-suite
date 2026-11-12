import { NOTIFICATION_TYPES } from "@hosanna/notifications";
import { listPreferences, upsertPreference } from "@hosanna/notifications";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { AuthHttpError, jsonError, requireAuthSession } from "@/lib/notifications/session";

const patchSchema = z.object({
  type: z.string().min(1).max(128).nullable().optional(),
  category: z.string().min(1).max(64).nullable().optional(),
  inbox: z.boolean().optional(),
  push: z.boolean().optional(),
  email: z.boolean().optional(),
  quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  quietHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  timezone: z.string().min(1).max(64).nullable().optional(),
});

/** GET /api/notifications/preferences */
export async function GET() {
  try {
    const ctx = await requireAuthSession();
    const preferences = await listPreferences(prisma, ctx.userId);
    return Response.json({
      preferences,
      catalog: Object.values(NOTIFICATION_TYPES),
    });
  } catch (err) {
    return jsonError(err);
  }
}

/** PATCH /api/notifications/preferences */
export async function PATCH(req: Request) {
  try {
    const ctx = await requireAuthSession();
    const json = await req.json();
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) {
      throw new AuthHttpError(400, parsed.error.issues[0]?.message ?? "Invalid body");
    }

    const preference = await upsertPreference(prisma, {
      userId: ctx.userId,
      ...parsed.data,
    });
    return Response.json({ preference });
  } catch (err) {
    return jsonError(err);
  }
}
