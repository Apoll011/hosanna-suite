// SPDX-License-Identifier: AGPL-3.0-only
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createCache,
  createScopedCache,
  createSecondaryStorage,
  globalCacheKey,
  orgCacheKey,
  orgUserCacheKey,
  userCacheKey,
  type ScopedCacheKey,
} from "../src/index.js";

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

describe("createScopedCache & scoped key helpers", () => {
  it("formats org, orgUser, user, and global keys deterministically", () => {
    assert.equal(orgCacheKey("org_1", "songs"), "org:org_1:songs");
    assert.equal(orgUserCacheKey("org_1", "user_1", "role"), "org:org_1:user:user_1:role");
    assert.equal(userCacheKey("user_1", "export"), "user:user_1:export");
    assert.equal(globalCacheKey("jwks", "document"), "global:jwks:document");
  });

  it("rejects empty or colon-containing tenant/user segments", () => {
    assert.throws(() => orgCacheKey("", "songs"));
    assert.throws(() => orgCacheKey("org:1", "songs"));
    assert.throws(() => orgUserCacheKey("org_1", "", "role"));
    assert.throws(() => orgUserCacheKey("org_1", "u:1", "role"));
    assert.throws(() => userCacheKey(" ", "export"));
    assert.throws(() => globalCacheKey());
  });

  it("rejects unscoped keys at runtime and isolates orgs", async () => {
    const cache = createScopedCache({ namespace: "test:scoped" });
    await cache.set(orgCacheKey("org_a", "item"), "payload-a");
    await cache.set(orgCacheKey("org_b", "item"), "payload-b");

    assert.equal(await cache.get(orgCacheKey("org_a", "item")), "payload-a");
    assert.equal(await cache.get(orgCacheKey("org_b", "item")), "payload-b");

    await assert.rejects(() => cache.get("unscoped-key" as unknown as ScopedCacheKey));
    await assert.rejects(() => cache.set("unscoped-key" as unknown as ScopedCacheKey, "x"));
    await assert.rejects(() => cache.delete("unscoped-key" as unknown as ScopedCacheKey));
  });
});
