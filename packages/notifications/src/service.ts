import { randomUUID } from "node:crypto";
import { createFcmClient } from "./channels/fcm.js";
import { deletePushDevicesByIds, listEnabledDevicesForUsers } from "./devices.js";
import { getPreferencesForUsers, resolveChannelsForUser } from "./preferences.js";
import { resolveRecipients } from "./recipients.js";
import type {
  DispatchInput,
  DispatchResult,
  NotificationChannel,
  NotificationServiceDeps,
} from "./types.js";

function legacyChannelToList(
  channel?: string,
): NotificationChannel[] | undefined {
  if (!channel) return undefined;
  if (channel === "inbox") return ["inbox"];
  if (channel === "push") return ["push"];
  if (channel === "both") return ["inbox", "push"];
  return undefined;
}

export function createNotificationService(deps: NotificationServiceDeps) {
  const fcm = createFcmClient(deps.fcm);

  async function logDelivery(
    rows: Array<{
      userId: string;
      type: string;
      channel: NotificationChannel;
      status: string;
      error?: string;
      meta?: Record<string, unknown>;
    }>,
  ) {
    if (rows.length === 0) return;
    try {
      await deps.prisma.notificationDelivery.createMany({
        data: rows.map((r) => ({
          id: randomUUID(),
          userId: r.userId,
          type: r.type,
          channel: r.channel,
          status: r.status,
          error: r.error ?? null,
          meta: r.meta ?? undefined,
        })),
      });
    } catch (err) {
      console.error("[notifications] delivery log failed:", err);
    }
  }

  async function dispatch(input: DispatchInput & { channel?: string }): Promise<DispatchResult> {
    const body = input.body ?? input.description;
    const requested =
      input.channels ??
      legacyChannelToList(input.channel) ??
      undefined;

    const userIds = await resolveRecipients(deps.prisma, input);
    const result: DispatchResult = {
      ok: true,
      recipientCount: userIds.length,
      inbox: { created: 0 },
      push: { sent: 0, invalidTokensPruned: 0 },
      email: { sent: 0, failed: 0 },
    };
    if (userIds.length === 0) return result;

    const prefs = input.bypassPreferences
      ? new Map()
      : await getPreferencesForUsers(deps.prisma, userIds, input.type);

    const perUserChannels = new Map(
      userIds.map((id) => [
        id,
        resolveChannelsForUser({
          type: input.type,
          requested,
          preference: prefs.get(id),
          bypassPreferences: input.bypassPreferences,
        }),
      ]),
    );

    const inboxUsers = userIds.filter((id) => perUserChannels.get(id)?.inbox);
    const pushUsers = userIds.filter((id) => perUserChannels.get(id)?.push);
    const emailUsers = userIds.filter((id) => perUserChannels.get(id)?.email);

    // Inbox — prefer better-inbox org/user fan-out when targeting matches,
    // otherwise notify per user.
    if (inboxUsers.length > 0) {
      try {
        if (
          input.organizationId &&
          !input.userId &&
          !input.teamId &&
          inboxUsers.length === userIds.length
        ) {
          const r = await deps.inboxNotify({
            organizationId: input.organizationId,
            roles: input.roles,
            type: input.type,
            title: input.title,
            ...(body != null ? { body } : {}),
            ...(input.href != null ? { href: input.href } : {}),
            ...(input.data != null ? { data: input.data } : {}),
          });
          result.inbox.created = r?.count ?? inboxUsers.length;
        } else {
          await Promise.all(
            inboxUsers.map(async (userId) => {
              await deps.inboxNotify({
                userId,
                type: input.type,
                title: input.title,
                ...(body != null ? { body } : {}),
                ...(input.href != null ? { href: input.href } : {}),
                ...(input.data != null ? { data: input.data } : {}),
              });
            }),
          );
          result.inbox.created = inboxUsers.length;
        }
        await logDelivery(
          inboxUsers.map((userId) => ({
            userId,
            type: input.type,
            channel: "inbox" as const,
            status: "sent",
          })),
        );
      } catch (err) {
        console.error("[notifications] inbox failed:", err);
        await logDelivery(
          inboxUsers.map((userId) => ({
            userId,
            type: input.type,
            channel: "inbox" as const,
            status: "failed",
            error: err instanceof Error ? err.message : String(err),
          })),
        );
      }
    }

    // Push via PushDevice registry
    if (pushUsers.length > 0) {
      const devices = await listEnabledDevicesForUsers(deps.prisma, pushUsers);
      const message = {
        title: input.push?.title ?? input.title,
        body: input.push?.body ?? body ?? input.title,
        data: {
          type: input.type,
          ...(input.href ? { href: input.href } : {}),
          ...(body ? { description: body } : {}),
          ...(input.data ?? {}),
          ...(input.push?.data ?? {}),
        },
      };

      const deadIds: string[] = [];
      await Promise.all(
        devices.map(async (device: { id: string; userId: string; token: string }) => {
          const outcome = await fcm.sendFcmToToken(device.token, message);
          if (outcome.ok) {
            result.push.sent++;
            await logDelivery([
              {
                userId: device.userId,
                type: input.type,
                channel: "push",
                status: "sent",
                meta: { deviceId: device.id },
              },
            ]);
          } else if (outcome.invalidToken) {
            deadIds.push(device.id);
            await logDelivery([
              {
                userId: device.userId,
                type: input.type,
                channel: "push",
                status: "invalid_token",
                error: outcome.error,
                meta: { deviceId: device.id },
              },
            ]);
          } else {
            await logDelivery([
              {
                userId: device.userId,
                type: input.type,
                channel: "push",
                status: "failed",
                error: outcome.error,
                meta: { deviceId: device.id },
              },
            ]);
          }
        }),
      );

      if (deadIds.length > 0) {
        result.push.invalidTokensPruned = await deletePushDevicesByIds(deps.prisma, deadIds);
      }
    }

    // Email
    if (emailUsers.length > 0 && deps.sendEmail && deps.resolveUserEmail) {
      await Promise.all(
        emailUsers.map(async (userId) => {
          try {
            const user = await deps.resolveUserEmail!(userId);
            if (!user?.email) {
              result.email.failed++;
              return;
            }
            const subject = input.email?.subject ?? input.title;
            await deps.sendEmail!({
              to: user.email,
              subject,
              html: input.email?.html,
              text: input.email?.text ?? body ?? input.title,
              template: input.email?.template,
              variables: {
                title: input.title,
                body: body ?? "",
                href: input.href,
                ...(input.email?.variables ?? {}),
              },
              locale: user.locale,
            });
            result.email.sent++;
            await logDelivery([
              { userId, type: input.type, channel: "email", status: "sent" },
            ]);
          } catch (err) {
            result.email.failed++;
            await logDelivery([
              {
                userId,
                type: input.type,
                channel: "email",
                status: "failed",
                error: err instanceof Error ? err.message : String(err),
              },
            ]);
          }
        }),
      );
    }

    return result;
  }

  /** Convenience: org fan-out with type defaults. */
  async function notifyOrg(
    payload: Omit<DispatchInput, "userId" | "teamId"> & { organizationId: string },
  ) {
    return dispatch(payload);
  }

  async function notifyUser(payload: Omit<DispatchInput, "organizationId" | "teamId" | "roles"> & {
    userId: string;
  }) {
    return dispatch(payload);
  }

  return {
    dispatch,
    notifyOrg,
    notifyUser,
    fcm,
  };
}

export type NotificationService = ReturnType<typeof createNotificationService>;
