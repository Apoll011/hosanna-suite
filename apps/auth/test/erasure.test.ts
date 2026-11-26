// SPDX-License-Identifier: AGPL-3.0-only
import assert from "node:assert/strict";
import { describe, it } from "node:test";

process.env.SKIP_ENV_VALIDATION ??= "true";

const { eraseAccount } = await import("../lib/erasure/account");
const { eraseOrganization } = await import("../lib/erasure/organization");
const { sendErasureOtp, verifyErasureOtp } = await import("../lib/erasure/otp");

describe("erasure OTP", () => {
  it("issues a 6-digit OTP, verifies it once, and rejects reuse or wrong codes", async () => {
    const rows: Array<{ id: string; identifier: string; value: string; expiresAt: Date }> = [];
    let sentCode = "";

    const mockDb = {
      verification: {
        deleteMany: async ({ where }: any) => {
          for (let i = rows.length - 1; i >= 0; i--) {
            if (rows[i]!.identifier === where.identifier) rows.splice(i, 1);
          }
          return { count: 1 };
        },
        create: async ({ data }: any) => {
          rows.push(data);
          return data;
        },
        findFirst: async ({ where }: any) => {
          return rows.find((r) => r.identifier === where.identifier) ?? null;
        },
        delete: async ({ where }: any) => {
          const idx = rows.findIndex((r) => r.id === where.id);
          if (idx >= 0) rows.splice(idx, 1);
        },
      },
    } as any;

    await sendErasureOtp({
      kind: "account",
      userId: "user-1",
      email: "ada@example.com",
      db: mockDb,
      sendEmail: async (code) => {
        sentCode = code;
      },
    });

    assert.match(sentCode, /^\d{6}$/);
    assert.equal(rows.length, 1);

    const wrong = await verifyErasureOtp({
      kind: "account",
      userId: "user-1",
      otp: "000000",
      db: mockDb,
    });
    assert.equal(wrong, false);
    assert.equal(rows.length, 1);

    const valid = await verifyErasureOtp({
      kind: "account",
      userId: "user-1",
      otp: sentCode,
      db: mockDb,
    });
    assert.equal(valid, true);
    assert.equal(rows.length, 0);

    const replay = await verifyErasureOtp({
      kind: "account",
      userId: "user-1",
      otp: sentCode,
      db: mockDb,
    });
    assert.equal(replay, false);
  });

  it("rejects expired OTPs and cleans up the expired row", async () => {
    const rows = [
      {
        id: "v-1",
        identifier: "erasure:account:user-2",
        value: "00".repeat(32),
        expiresAt: new Date(Date.now() - 1000),
      },
    ];

    const mockDb = {
      verification: {
        findFirst: async () => rows[0] ?? null,
        delete: async () => {
          rows.length = 0;
        },
      },
    } as any;

    const ok = await verifyErasureOtp({
      kind: "account",
      userId: "user-2",
      otp: "123456",
      db: mockDb,
    });
    assert.equal(ok, false);
    assert.equal(rows.length, 0);
  });
});

describe("eraseOrganization", () => {
  it("cancels Stripe subscription immediately, detaches DPA records, deletes org and logo", async () => {
    const calls: string[] = [];
    const canceledSubs: string[] = [];
    const deletedLogos: string[] = [];

    const mockTx = {
      organizationAgreement: {
        updateMany: async (args: any) => {
          calls.push(`agreement.updateMany:${JSON.stringify(args.data)}`);
          return { count: 1 };
        },
      },
      subscription: {
        deleteMany: async () => {
          calls.push("subscription.deleteMany");
          return { count: 1 };
        },
      },
      notification: {
        deleteMany: async () => {
          calls.push("notification.deleteMany");
          return { count: 2 };
        },
      },
      oauthAccessToken: {
        deleteMany: async () => {
          calls.push("oauthAccessToken.deleteMany");
          return { count: 0 };
        },
      },
      oauthRefreshToken: {
        deleteMany: async () => {
          calls.push("oauthRefreshToken.deleteMany");
          return { count: 0 };
        },
      },
      oauthConsent: {
        deleteMany: async () => {
          calls.push("oauthConsent.deleteMany");
          return { count: 0 };
        },
      },
      oauthClient: {
        deleteMany: async () => {
          calls.push("oauthClient.deleteMany");
          return { count: 0 };
        },
      },
      verification: {
        deleteMany: async () => {
          calls.push("verification.deleteMany");
          return { count: 1 };
        },
      },
      organization: {
        delete: async ({ where }: any) => {
          calls.push(`organization.delete:${where.id}`);
          return { id: where.id };
        },
      },
    };

    const mockDb = {
      organization: {
        findUnique: async () => ({
          id: "org-1",
          logo: "https://auth.hosanna.live/api/media/organization/org-1",
        }),
      },
      subscription: {
        findMany: async () => [{ id: "sub-1", stripeSubscriptionId: "sub_stripe_123" }],
      },
      $transaction: async (fn: (tx: any) => Promise<void>) => fn(mockTx),
    } as any;

    const mockStripe = {
      subscriptions: {
        cancel: async (id: string) => {
          canceledSubs.push(id);
          return {};
        },
      },
    } as any;

    const result = await eraseOrganization("org-1", mockStripe, {
      db: mockDb,
      deleteLogo: async (id) => {
        deletedLogos.push(id);
      },
    });

    assert.equal(result.deleted, true);
    assert.deepEqual(canceledSubs, ["sub_stripe_123"]);
    assert.deepEqual(deletedLogos, ["org-1"]);
    assert.ok(
      calls.includes('agreement.updateMany:{"deletedOrgId":"org-1","organizationId":null}'),
    );
    assert.ok(calls.includes("subscription.deleteMany"));
    assert.ok(calls.includes("notification.deleteMany"));
    assert.ok(calls.includes("organization.delete:org-1"));
  });
});

describe("eraseAccount", () => {
  it("blocks deletion when user is sole owner of an organization", async () => {
    const mockDb = {
      member: {
        findMany: async () => [{ organizationId: "org-1" }],
        count: async () => 1,
      },
      organization: {
        findUnique: async () => ({ id: "org-1", name: "Grace Church", slug: "grace" }),
      },
    } as any;

    const outcome = await eraseAccount("user-1", { db: mockDb });
    assert.deepEqual(outcome, {
      blocked: true,
      reason: "sole_owner",
      orgs: [{ id: "org-1", name: "Grace Church", slug: "grace" }],
    });
  });

  it("revokes sessions, deletes user and OAuth rows, removes avatar, and sends goodbye email", async () => {
    const events: string[] = [];

    const mockTx = {
      oauthAccessToken: { deleteMany: async () => ({ count: 0 }) },
      oauthRefreshToken: { deleteMany: async () => ({ count: 0 }) },
      oauthConsent: { deleteMany: async () => ({ count: 0 }) },
      oauthClient: { deleteMany: async () => ({ count: 0 }) },
      verification: { deleteMany: async () => ({ count: 1 }) },
      user: {
        delete: async ({ where }: any) => {
          events.push(`user.delete:${where.id}`);
          return { id: where.id };
        },
      },
    };

    const mockDb = {
      member: {
        findMany: async () => [{ organizationId: "org-1" }],
        count: async () => 2,
      },
      user: {
        findUnique: async () => ({ id: "user-1", email: "ada@example.com", name: "Ada" }),
      },
      $transaction: async (fn: (tx: any) => Promise<void>) => fn(mockTx),
    } as any;

    const outcome = await eraseAccount("user-1", {
      db: mockDb,
      revokeSessions: async (id) => {
        events.push(`revoke:${id}`);
      },
      deleteAvatar: async (id) => {
        events.push(`avatar:${id}`);
      },
      sendDeletedEmail: async (email) => {
        events.push(`email:${email}`);
      },
    });

    assert.deepEqual(outcome, { deleted: true });
    assert.deepEqual(events, [
      "revoke:user-1",
      "user.delete:user-1",
      "avatar:user-1",
      "email:ada@example.com",
    ]);
  });
});
