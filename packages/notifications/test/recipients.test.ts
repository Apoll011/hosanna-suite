import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveRecipients } from "../src/recipients.js";

describe("resolveRecipients", () => {
  it("returns a single userId", async () => {
    const ids = await resolveRecipients({}, { userId: "user-1" });
    assert.deepEqual(ids, ["user-1"]);
  });

  it("rejects mixing userId with org/team", async () => {
    await assert.rejects(
      () => resolveRecipients({}, { userId: "u1", organizationId: "o1" }),
      /either userId or organizationId/,
    );
  });

  it("resolves organization members with optional role filter", async () => {
    const prisma = {
      member: {
        findMany: async (args: any) => {
          assert.equal(args.where.organizationId, "org-1");
          assert.deepEqual(args.where.role, { in: ["admin"] });
          return [{ userId: "a" }, { userId: "a" }, { userId: "b" }];
        },
      },
    };
    const ids = await resolveRecipients(prisma, {
      organizationId: "org-1",
      roles: ["admin"],
    });
    assert.deepEqual(ids, ["a", "b"]);
  });

  it("returns empty list when team is missing", async () => {
    const prisma = {
      team: { findUnique: async () => null },
    };
    const ids = await resolveRecipients(prisma, { teamId: "missing" });
    assert.deepEqual(ids, []);
  });

  it("resolves team members and filters by org role", async () => {
    const prisma = {
      team: {
        findUnique: async () => ({ id: "t1", organizationId: "org-1" }),
      },
      teamMember: {
        findMany: async () => [{ userId: "u1" }, { userId: "u2" }, { userId: "u1" }],
      },
      member: {
        findMany: async (args: any) => {
          assert.equal(args.where.organizationId, "org-1");
          assert.deepEqual(args.where.userId, { in: ["u1", "u2"] });
          return [{ userId: "u2" }];
        },
      },
    };
    const ids = await resolveRecipients(prisma, {
      teamId: "t1",
      roles: ["musician"],
    });
    assert.deepEqual(ids, ["u2"]);
  });

  it("resolves team without role filter", async () => {
    const prisma = {
      team: {
        findUnique: async () => ({ id: "t1", organizationId: "org-1" }),
      },
      teamMember: {
        findMany: async () => [{ userId: "u1" }, { userId: "u3" }],
      },
    };
    const ids = await resolveRecipients(prisma, { teamId: "t1" });
    assert.deepEqual(ids, ["u1", "u3"]);
  });

  it("throws when no target is provided", async () => {
    await assert.rejects(() => resolveRecipients({}, {}), /Provide userId/);
  });
});
