import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createCache } from "../src/index.js";

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
});
