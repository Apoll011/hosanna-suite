import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  deletePushDevicesByIds,
  disablePushDevice,
  listEnabledDevicesForUsers,
  migrateSessionFcmToDevices,
  registerPushDevice,
  revokeDevicesForSession,
} from "../src/devices.js";

describe("registerPushDevice", () => {
  it("rejects empty tokens", async () => {
    await assert.rejects(() => registerPushDevice({}, { userId: "u1", token: "  " }), /required/);
  });

  it("updates an existing token row", async () => {
    const prisma = {
      pushDevice: {
        findUnique: async () => ({
          token: "tok",
          sessionId: "old",
          platform: "android",
          appId: "musician",
        }),
        update: async (args: any) => args.data,
        create: async () => {
          throw new Error("should not create");
        },
      },
    };
    const row = await registerPushDevice(prisma, {
      userId: "u2",
      token: "tok",
      platform: "ios",
      appId: "studio",
    });
    assert.equal(row.userId, "u2");
    assert.equal(row.platform, "ios");
    assert.equal(row.appId, "studio");
    assert.equal(row.enabled, true);
  });

  it("creates a new device when token is unknown", async () => {
    const prisma = {
      pushDevice: {
        findUnique: async () => null,
        create: async (args: any) => args.data,
      },
    };
    const row = await registerPushDevice(prisma, {
      userId: "u1",
      token: "new-token",
    });
    assert.equal(row.token, "new-token");
    assert.equal(row.platform, "unknown");
    assert.equal(row.appId, "unknown");
    assert.ok(row.id);
  });
});

describe("device lifecycle helpers", () => {
  it("revokeDevicesForSession disables bound devices", async () => {
    const prisma = {
      pushDevice: {
        updateMany: async (args: any) => {
          assert.equal(args.where.sessionId, "s1");
          assert.equal(args.data.enabled, false);
          return { count: 2 };
        },
      },
    };
    assert.equal(await revokeDevicesForSession(prisma, "s1"), 2);
  });

  it("disablePushDevice filters by token or device id", async () => {
    const prisma = {
      pushDevice: {
        updateMany: async (args: any) => {
          assert.equal(args.where.userId, "u1");
          assert.equal(args.where.token, "tok");
          return { count: 1 };
        },
      },
    };
    assert.equal(await disablePushDevice(prisma, { userId: "u1", token: "tok" }), 1);
  });

  it("deletePushDevicesByIds no-ops on empty input", async () => {
    assert.equal(await deletePushDevicesByIds({}, []), 0);
  });

  it("deletePushDevicesByIds deletes matching ids", async () => {
    const prisma = {
      pushDevice: {
        deleteMany: async (args: any) => {
          assert.deepEqual(args.where.id, { in: ["a", "b"] });
          return { count: 2 };
        },
      },
    };
    assert.equal(await deletePushDevicesByIds(prisma, ["a", "b"]), 2);
  });

  it("listEnabledDevicesForUsers dedupes tokens", async () => {
    const prisma = {
      pushDevice: {
        findMany: async () => [
          { id: "1", userId: "u1", token: "same" },
          { id: "2", userId: "u2", token: "same" },
          { id: "3", userId: "u3", token: "other" },
        ],
      },
    };
    const devices = await listEnabledDevicesForUsers(prisma, ["u1", "u2", "u3"]);
    assert.equal(devices.length, 2);
    assert.equal(devices[0]!.token, "same");
    assert.equal(devices[1]!.token, "other");
  });

  it("listEnabledDevicesForUsers returns [] for empty users", async () => {
    assert.deepEqual(await listEnabledDevicesForUsers({}, []), []);
  });

  it("migrateSessionFcmToDevices skips existing tokens", async () => {
    const created: string[] = [];
    const prisma = {
      session: {
        findMany: async () => [
          { id: "s1", userId: "u1", fcm: "tok-a" },
          { id: "s2", userId: "u2", fcm: "tok-b" },
          { id: "s3", userId: "u3", fcm: null },
        ],
      },
      pushDevice: {
        findUnique: async ({ where }: any) => (where.token === "tok-a" ? { id: "existing" } : null),
        create: async ({ data }: any) => {
          created.push(data.token);
          return data;
        },
      },
    };
    const result = await migrateSessionFcmToDevices(prisma);
    assert.equal(result.migrated, 1);
    assert.deepEqual(created, ["tok-b"]);
  });
});
