import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  IdempotencyConflictError,
  payloadHash,
  withClientRequestId,
} from "../../../src/mcp/lib/idempotency.js";

describe("idempotency", () => {
  it("hashes payloads stably regardless of key order", () => {
    assert.equal(payloadHash({ b: 1, a: 2 }), payloadHash({ a: 2, b: 1 }));
  });

  it("returns cached result for same id + payload", async () => {
    let runs = 0;
    const org = `org-${Math.random()}`;
    const id = "req-1";
    const payload = { name: "Folder", parentId: null };
    const first = await withClientRequestId(
      org,
      id,
      async () => {
        runs += 1;
        return { created: true, n: runs };
      },
      payload,
    );
    const second = await withClientRequestId(
      org,
      id,
      async () => {
        runs += 1;
        return { created: true, n: runs };
      },
      payload,
    );
    assert.deepEqual(first, second);
    assert.equal(runs, 1);
  });

  it("conflicts when same id is reused with different payload", async () => {
    const org = `org-${Math.random()}`;
    const id = "req-2";
    await withClientRequestId(org, id, async () => ({ ok: true }), {
      name: "A",
    });
    await assert.rejects(
      () => withClientRequestId(org, id, async () => ({ ok: true }), { name: "B" }),
      (err: unknown) => err instanceof IdempotencyConflictError,
    );
  });

  it("skips the cache when clientRequestId is missing or blank", async () => {
    let runs = 0;
    const org = `org-${Math.random()}`;
    const run = () =>
      withClientRequestId(org, "   ", async () => {
        runs += 1;
        return runs;
      });
    assert.equal(await run(), 1);
    assert.equal(
      await withClientRequestId(org, undefined, async () => {
        runs += 1;
        return runs;
      }),
      2,
    );
    assert.equal(runs, 2);
  });

  it("hashes nullish payloads the same way", () => {
    assert.equal(payloadHash(undefined), payloadHash(null));
  });

  it("coalesces concurrent same-id runs into a single execution", async () => {
    const org = `org-${Math.random()}`;
    const id = "req-concurrent";
    let runs = 0;
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let started!: () => void;
    const startedP = new Promise<void>((resolve) => {
      started = resolve;
    });

    const run = () =>
      withClientRequestId(
        org,
        id,
        async () => {
          runs += 1;
          started();
          await gate;
          return { runs };
        },
        { name: "Folder" },
      );

    const p1 = run();
    await startedP;
    const p2 = run();
    // Second caller joins the in-flight promise — `run` must not execute twice.
    assert.equal(runs, 1);
    release();
    const [a, b] = await Promise.all([p1, p2]);
    assert.deepEqual(a, b);
    assert.equal(runs, 1);
  });

  it("conflicts when a concurrent call reuses the id with a different payload", async () => {
    const org = `org-${Math.random()}`;
    const id = "req-conflict-concurrent";
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let started!: () => void;
    const startedP = new Promise<void>((resolve) => {
      started = resolve;
    });

    const first = withClientRequestId(
      org,
      id,
      async () => {
        started();
        await gate;
        return { ok: true };
      },
      { name: "A" },
    );
    await startedP;
    await assert.rejects(
      () => withClientRequestId(org, id, async () => ({ ok: true }), { name: "B" }),
      (err: unknown) => err instanceof IdempotencyConflictError,
    );
    release();
    await first;
  });
});
