import { roles } from "@hosanna/auth";
import { z } from "zod";
import { getNotificationService } from "@/lib/notifications/service";
import {
  AuthHttpError,
  assertPermission,
  jsonError,
  requireAuthSession,
} from "@/lib/notifications/session";

const ORG_ROLES = Object.keys(roles) as [string, ...string[]];

const fcmMessageSchema = z
  .object({
    title: z.string().min(1).max(255).optional(),
    body: z.string().min(1).max(1000).optional(),
    data: z.record(z.string(), z.string().max(1000)).optional(),
  })
  .refine((m) => m.title !== undefined || m.body !== undefined || m.data !== undefined, {
    message: "push/fcm message cannot be empty.",
  });

const createNotificationSchema = z
  .object({
    userId: z.string().min(1).optional(),
    organizationId: z.string().min(1).optional(),
    teamId: z.string().min(1).optional(),
    roles: z.array(z.enum(ORG_ROLES as [string, ...string[]])).min(1).optional(),
    type: z.string().min(1).max(128),
    title: z.string().min(1).max(255),
    description: z.string().max(1000).optional(),
    body: z.string().max(1000).optional(),
    href: z.string().min(1).max(2048).optional(),
    data: z.record(z.string(), z.string().max(1000)).optional(),
    /** Legacy single-user channel enum. */
    channel: z.enum(["inbox", "push", "both"]).optional(),
    channels: z.array(z.enum(["inbox", "push", "email"])).min(1).optional(),
    fcm: fcmMessageSchema.optional(),
    push: fcmMessageSchema.optional(),
    email: z
      .object({
        subject: z.string().min(1).max(255).optional(),
        template: z.string().min(1).max(128).optional(),
        variables: z.record(z.string(), z.unknown()).optional(),
        html: z.string().optional(),
        text: z.string().optional(),
      })
      .optional(),
  })
  .refine(
    (data) => {
      const targets = [data.userId, data.organizationId, data.teamId].filter(Boolean);
      return targets.length === 1;
    },
    {
      message: "Provide exactly one of userId, organizationId, or teamId.",
      path: ["userId"],
    },
  )
  .refine((data) => !data.roles || !!(data.organizationId || data.teamId), {
    message: "roles can only be used together with organizationId or teamId.",
    path: ["roles"],
  });

/** POST /api/notifications — unified multi-channel dispatch. */
export async function POST(req: Request) {
  try {
    const ctx = await requireAuthSession();
    assertPermission(ctx, "notification.sent");

    const json = await req.json();
    const parsed = createNotificationSchema.safeParse(json);
    if (!parsed.success) {
      throw new AuthHttpError(400, parsed.error.issues[0]?.message ?? "Invalid body");
    }

    const body = parsed.data;
    const result = await getNotificationService().dispatch({
      userId: body.userId,
      organizationId: body.organizationId,
      teamId: body.teamId,
      roles: body.roles,
      type: body.type,
      title: body.title,
      body: body.body ?? body.description,
      href: body.href,
      data: body.data,
      channels: body.channels,
      channel: body.channel,
      push: body.push ?? body.fcm,
      email: body.email,
    });

    return Response.json(
      {
        ok: true,
        recipientCount: result.recipientCount,
        inbox: result.inbox,
        push: {
          sent: result.push.sent,
          invalidTokensPruned: result.push.invalidTokensPruned,
        },
        email: result.email,
      },
      { status: 201 },
    );
  } catch (err) {
    return jsonError(err);
  }
}
