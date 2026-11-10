import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createCache, createSecondaryStorage } from "../src/index.js";

describe("createCache (memory)", () => {
  it("round-trips values with TTL", async () => {
    const cache = createCache({ namespace: "test:roundtrip", ttlMs: 5_000 });
    await cache.set("a", { ok: true });
    assert.deepEqual(await cache.get("a"), { ok: true });
    await cache.delete("a");
    assert.equal(await cache.get("a"), undefined);
  });

  it("isolates namespaces", async () => {
    const a = createCache({ namespace: "test:ns-a" });
    const b = createCache({ namespace: "test:ns-b" });
    await a.set("k", 1);
    await b.set("k", 2);
    assert.equal(await a.get("k"), 1);
    assert.equal(await b.get("k"), 2);
  });

  it("overwrites, clears, and reports delete results", async () => {
    const cache = createCache({ namespace: "test:ops" });
    assert.equal(cache.namespace, "test:ops");
    await cache.ready();
    await cache.set("k", 1);
    await cache.set("k", 2);
    assert.equal(await cache.get("k"), 2);
    assert.equal(await cache.delete("k"), true);
    assert.equal(await cache.get("k"), undefined);
    await cache.set("x", "y");
    await cache.set("z", "w");
    await cache.clear();
    assert.equal(await cache.get("x"), undefined);
    assert.equal(await cache.get("z"), undefined);
  });

  it("expires entries after per-set TTL", async () => {
    const cache = createCache({ namespace: "test:ttl-expiry" });
    await cache.set("ephemeral", "gone", 50);
    assert.equal(await cache.get("ephemeral"), "gone");
    await new Promise((r) => setTimeout(r, 80));
    assert.equal(await cache.get("ephemeral"), undefined);
  });
});

describe("createSecondaryStorage", () => {
  it("returns null without Redis URL (no network)", () => {
    const prev = process.env.REDIS_URL;
    delete process.env.REDIS_URL;
    try {
      assert.equal(createSecondaryStorage({ redisUrl: null }), null);
      assert.equal(createSecondaryStorage(), null);
    } finally {
      if (prev === undefined) delete process.env.REDIS_URL;
      else process.env.REDIS_URL = prev;
    }
  });
});
