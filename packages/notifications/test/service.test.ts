import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createNotificationService } from "../src/service.js";

function createPrismaMock(opts?: {
  members?: Array<{ userId: string }>;
  devices?: Array<{ id: string; userId: string; token: string }>;
  prefs?: any[];
}) {
  const deliveries: any[] = [];
  return {
    deliveries,
    prisma: {
      member: {
        findMany: async () => opts?.members ?? [{ userId: "u1" }],
      },
      team: { findUnique: async () => null },
      teamMember: { findMany: async () => [] },
      notificationPreference: {
        findMany: async () => opts?.prefs ?? [],
      },
      pushDevice: {
        findMany: async () => opts?.devices ?? [],
        deleteMany: async ({ where }: any) => ({ count: where.id.in.length }),
      },
      notificationDelivery: {
        createMany: async ({ data }: any) => {
          deliveries.push(...data);
          return { count: data.length };
        },
      },
    },
  };
}

describe("createNotificationService.dispatch", () => {
  it("returns empty result when there are no recipients", async () => {
    const { prisma } = createPrismaMock({ members: [] });
    const service = createNotificationService({
      prisma,
      fcm: {},
      inboxNotify: async () => ({ count: 0 }),
    });
    const result = await service.dispatch({
      type: "info",
      title: "Hello",
      organizationId: "org-1",
    });
    assert.equal(result.recipientCount, 0);
    assert.equal(result.inbox.created, 0);
  });

  it("fans out inbox via organization notify when all recipients match", async () => {
    const { prisma, deliveries } = createPrismaMock({
      members: [{ userId: "u1" }, { userId: "u2" }],
    });
    let orgCall = 0;
    const service = createNotificationService({
      prisma,
      fcm: {},
      inboxNotify: async (payload) => {
        if (payload.organizationId) {
          orgCall++;
          return { count: 2 };
        }
        return { count: 1 };
      },
    });

    const result = await service.dispatch({
      type: "organization",
      title: "Team note",
      description: "Details",
      organizationId: "org-1",
      channels: ["inbox"],
    });

    assert.equal(orgCall, 1);
    assert.equal(result.inbox.created, 2);
    assert.equal(deliveries.filter((d) => d.channel === "inbox").length, 2);
  });

  it("notifies users individually for user targets", async () => {
    const { prisma } = createPrismaMock();
    const userIds: string[] = [];
    const service = createNotificationService({
      prisma,
      fcm: {},
      inboxNotify: async (payload) => {
        if (payload.userId) userIds.push(payload.userId);
      },
    });

    const result = await service.notifyUser({
      userId: "u9",
      type: "info",
      title: "Hi",
      channels: ["inbox"],
    });

    assert.deepEqual(userIds, ["u9"]);
    assert.equal(result.inbox.created, 1);
  });

  it("sends email when channel is enabled and helpers are wired", async () => {
    const { prisma } = createPrismaMock({ members: [{ userId: "u1" }] });
    const emails: string[] = [];
    const service = createNotificationService({
      prisma,
      fcm: {},
      inboxNotify: async () => undefined,
      resolveUserEmail: async (userId) =>
        userId === "u1" ? { email: "a@example.com", locale: "en" } : null,
      sendEmail: async ({ to, subject }) => {
        emails.push(`${to}:${subject}`);
      },
    });

    const result = await service.dispatch({
      type: "billing.subscribed",
      title: "Subscribed",
      userId: "u1",
      channels: ["email"],
      bypassPreferences: true,
    });

    assert.equal(result.email.sent, 1);
    assert.deepEqual(emails, ["a@example.com:Subscribed"]);
  });

  it("supports legacy channel=both mapping", async () => {
    const { prisma } = createPrismaMock({ members: [{ userId: "u1" }] });
    const service = createNotificationService({
      prisma,
      fcm: {},
      inboxNotify: async () => ({ count: 1 }),
    });
    const result = await service.dispatch({
      type: "info",
      title: "Legacy",
      userId: "u1",
      channel: "both",
    } as any);
    assert.equal(result.inbox.created, 1);
  });

  it("notifyOrg delegates to dispatch", async () => {
    const { prisma } = createPrismaMock({ members: [{ userId: "u1" }] });
    const service = createNotificationService({
      prisma,
      fcm: {},
      inboxNotify: async () => ({ count: 1 }),
    });
    const result = await service.notifyOrg({
      organizationId: "org-1",
      type: "info",
      title: "Org",
      channels: ["inbox"],
    });
    assert.equal(result.recipientCount, 1);
  });

  it("attempts push delivery for enabled devices", async () => {
    const { prisma, deliveries } = createPrismaMock({
      members: [{ userId: "u1" }],
      devices: [{ id: "d1", userId: "u1", token: "tok-1" }],
    });
    const service = createNotificationService({
      prisma,
      fcm: {},
      inboxNotify: async () => undefined,
    });
    const result = await service.dispatch({
      type: "agenda.reminder",
      title: "Soon",
      userId: "u1",
      channels: ["push"],
      bypassPreferences: true,
    });
    // No FCM project configured → send fails, but the push path still runs.
    assert.equal(result.push.sent, 0);
    assert.ok(deliveries.some((d) => d.channel === "push" && d.status === "failed"));
  });

  it("counts email failures when resolveUserEmail returns null", async () => {
    const { prisma } = createPrismaMock();
    const service = createNotificationService({
      prisma,
      fcm: {},
      inboxNotify: async () => undefined,
      resolveUserEmail: async () => null,
      sendEmail: async () => undefined,
    });
    const result = await service.dispatch({
      type: "info",
      title: "Mail",
      userId: "u1",
      channels: ["email"],
      bypassPreferences: true,
    });
    assert.equal(result.email.failed, 1);
    assert.equal(result.email.sent, 0);
  });
});
