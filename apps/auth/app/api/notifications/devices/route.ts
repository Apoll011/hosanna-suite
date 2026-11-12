import {
  disablePushDevice,
  registerPushDevice,
} from "@hosanna/notifications";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { AuthHttpError, jsonError, requireAuthSession } from "@/lib/notifications/session";

const registerSchema = z.object({
  token: z.string().min(8).max(4096),
  platform: z.enum(["android", "ios", "web", "unknown"]).optional(),
  appId: z.enum(["musician", "studio", "auth", "unknown"]).optional(),
  enabled: z.boolean().optional(),
});

const disableSchema = z.object({
  token: z.string().min(8).max(4096).optional(),
  deviceId: z.string().min(1).optional(),
  enabled: z.literal(false).optional(),
});

/** POST /api/notifications/devices — register / rotate FCM token. */
export async function POST(req: Request) {
  try {
    const ctx = await requireAuthSession();
    const json = await req.json();
    const parsed = registerSchema.safeParse(json);
    if (!parsed.success) {
      throw new AuthHttpError(400, parsed.error.issues[0]?.message ?? "Invalid body");
    }

    const device = await registerPushDevice(prisma, {
      userId: ctx.userId,
      sessionId: ctx.sessionId,
      token: parsed.data.token,
      platform: parsed.data.platform,
      appId: parsed.data.appId ?? "musician",
      enabled: parsed.data.enabled ?? true,
    });

    // Keep session.notify/fcm in sync for backwards compatibility during cutover.
    await prisma.session
      .update({
        where: { id: ctx.sessionId },
        data: {
          fcm: parsed.data.token,
          notify: parsed.data.enabled ?? true,
        },
      })
      .catch(() => undefined);

    return Response.json({ device }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}

/** DELETE /api/notifications/devices — disable a device for the current user. */
export async function DELETE(req: Request) {
  try {
    const ctx = await requireAuthSession();
    const json = await req.json().catch(() => ({}));
    const parsed = disableSchema.safeParse(json);
    if (!parsed.success) {
      throw new AuthHttpError(400, parsed.error.issues[0]?.message ?? "Invalid body");
    }
    if (!parsed.data.token && !parsed.data.deviceId) {
      throw new AuthHttpError(400, "Provide token or deviceId.");
    }

    const count = await disablePushDevice(prisma, {
      userId: ctx.userId,
      token: parsed.data.token,
      deviceId: parsed.data.deviceId,
    });

    if (parsed.data.token) {
      await prisma.session
        .updateMany({
          where: { userId: ctx.userId, fcm: parsed.data.token },
          data: { fcm: null, notify: false },
        })
        .catch(() => undefined);
    }

    return Response.json({ ok: true, disabled: count });
  } catch (err) {
    return jsonError(err);
  }
}
