import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getPreferencesForUsers,
  listPreferences,
  resolveChannelsForUser,
  upsertPreference,
} from "../src/preferences.js";

describe("resolveChannelsForUser", () => {
  it("uses type defaults when no channels are requested", () => {
    const channels = resolveChannelsForUser({ type: "agenda.reminder" });
    assert.deepEqual(channels, { inbox: true, push: true, email: false });
  });

  it("honors requested channels for overridable types", () => {
    const channels = resolveChannelsForUser({
      type: "service_updated",
      requested: ["email"],
    });
    assert.deepEqual(channels, { inbox: false, push: false, email: true });
  });

  it("applies user preference overrides", () => {
    const channels = resolveChannelsForUser({
      type: "agenda.reminder",
      preference: { inbox: true, push: false, email: true },
    });
    assert.deepEqual(channels, { inbox: true, push: false, email: true });
  });

  it("suppresses push and email during overnight quiet hours", () => {
    const channels = resolveChannelsForUser({
      type: "agenda.reminder",
      preference: {
        inbox: true,
        push: true,
        email: true,
        quietHoursStart: "22:00",
        quietHoursEnd: "07:00",
        timezone: "UTC",
      },
      now: new Date("2026-01-15T23:30:00Z"),
    });
    assert.deepEqual(channels, { inbox: true, push: false, email: false });
  });

  it("suppresses push and email during same-day quiet hours", () => {
    const channels = resolveChannelsForUser({
      type: "agenda.reminder",
      preference: {
        inbox: true,
        push: true,
        email: true,
        quietHoursStart: "08:00",
        quietHoursEnd: "10:00",
        timezone: "UTC",
      },
      now: new Date("2026-01-15T09:15:00Z"),
    });
    assert.deepEqual(channels, { inbox: true, push: false, email: false });
  });

  it("ignores quiet hours outside the window", () => {
    const channels = resolveChannelsForUser({
      type: "agenda.reminder",
      preference: {
        inbox: true,
        push: true,
        email: true,
        quietHoursStart: "08:00",
        quietHoursEnd: "10:00",
        timezone: "UTC",
      },
      now: new Date("2026-01-15T12:00:00Z"),
    });
    assert.deepEqual(channels, { inbox: true, push: true, email: true });
  });

  it("forces email for non-overridable security types", () => {
    const channels = resolveChannelsForUser({
      type: "auth.verify_email",
      requested: ["inbox"],
      preference: { email: false },
    });
    assert.equal(channels.email, true);
    assert.equal(channels.inbox, true);
  });

  it("skips preferences when bypassPreferences is set", () => {
    const channels = resolveChannelsForUser({
      type: "agenda.reminder",
      requested: ["push"],
      preference: { push: false, inbox: true },
      bypassPreferences: true,
    });
    assert.deepEqual(channels, { inbox: false, push: true, email: false });
  });
});

describe("preference persistence helpers", () => {
  it("getPreferencesForUsers returns empty map for no users", async () => {
    const map = await getPreferencesForUsers({} as any, [], "agenda.reminder");
    assert.equal(map.size, 0);
  });

  it("prefers type-specific preference over category and global", async () => {
    const prisma = {
      notificationPreference: {
        findMany: async () => [
          { userId: "u1", type: null, category: null, inbox: true, push: true, email: false },
          {
            userId: "u1",
            type: null,
            category: "agenda",
            inbox: true,
            push: false,
            email: false,
          },
          {
            userId: "u1",
            type: "agenda.reminder",
            category: "agenda",
            inbox: false,
            push: true,
            email: true,
          },
        ],
      },
    };
    const map = await getPreferencesForUsers(prisma, ["u1"], "agenda.reminder");
    assert.equal(map.get("u1").type, "agenda.reminder");
    assert.equal(map.get("u1").email, true);
  });

  it("upsertPreference updates an existing row", async () => {
    const calls: string[] = [];
    const prisma = {
      notificationPreference: {
        findFirst: async () => ({ id: "pref-1" }),
        update: async (args: any) => {
          calls.push("update");
          return { id: "pref-1", ...args.data };
        },
        create: async () => {
          calls.push("create");
          return {};
        },
      },
    };
    const row = await upsertPreference(prisma, {
      userId: "u1",
      category: "billing",
      inbox: true,
      push: false,
      email: true,
    });
    assert.deepEqual(calls, ["update"]);
    assert.equal(row.email, true);
    assert.equal(row.push, false);
  });

  it("upsertPreference creates when missing", async () => {
    const prisma = {
      notificationPreference: {
        findFirst: async () => null,
        update: async () => {
          throw new Error("should not update");
        },
        create: async (args: any) => ({ ...args.data }),
      },
    };
    const row = await upsertPreference(prisma, {
      userId: "u2",
      type: null,
      category: null,
      email: true,
    });
    assert.equal(row.userId, "u2");
    assert.equal(row.email, true);
    assert.ok(row.id);
  });

  it("listPreferences queries by userId", async () => {
    const prisma = {
      notificationPreference: {
        findMany: async (args: any) => {
          assert.equal(args.where.userId, "u9");
          return [{ id: "1" }];
        },
      },
    };
    const rows = await listPreferences(prisma, "u9");
    assert.equal(rows.length, 1);
  });
});
