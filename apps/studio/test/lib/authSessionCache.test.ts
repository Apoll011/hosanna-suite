import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CACHED_ORG_KEY,
  CACHED_TRIAL_KEY,
  CACHED_USER_KEY,
  canTrustCachedSessionForPaint,
  readCachedUserId,
} from "../../src/lib/authSessionCache";

function memoryStorage(initial: Record<string, string> = {}) {
  const map = new Map<string, string>(Object.entries(initial));
  return {
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    setItem(key: string, value: string) {
      map.set(key, String(value));
    },
    removeItem(key: string) {
      map.delete(key);
    },
  };
}

describe("canTrustCachedSessionForPaint", () => {
  it("is false with no cache", () => {
    assert.equal(canTrustCachedSessionForPaint(memoryStorage()), false);
  });

  it("is false when user is cached but org is missing (stale no-org)", () => {
    assert.equal(
      canTrustCachedSessionForPaint(
        memoryStorage({ [CACHED_USER_KEY]: JSON.stringify({ id: "u1" }) }),
      ),
      false,
    );
  });

  it("is false when trial is explicitly false", () => {
    assert.equal(
      canTrustCachedSessionForPaint(
        memoryStorage({
          [CACHED_USER_KEY]: JSON.stringify({ id: "u1" }),
          [CACHED_ORG_KEY]: JSON.stringify({ id: "o1", slug: "church" }),
          [CACHED_TRIAL_KEY]: "false",
        }),
      ),
      false,
    );
  });

  it("is true for a positive user+org snapshot", () => {
    assert.equal(
      canTrustCachedSessionForPaint(
        memoryStorage({
          [CACHED_USER_KEY]: JSON.stringify({ id: "u1" }),
          [CACHED_ORG_KEY]: JSON.stringify({ id: "o1", slug: "church" }),
          [CACHED_TRIAL_KEY]: "true",
        }),
      ),
      true,
    );
  });
});

describe("readCachedUserId", () => {
  it("reads id from cached user json", () => {
    assert.equal(
      readCachedUserId(memoryStorage({ [CACHED_USER_KEY]: JSON.stringify({ id: "abc" }) })),
      "abc",
    );
  });

  it("returns null for corrupt cache", () => {
    assert.equal(readCachedUserId(memoryStorage({ [CACHED_USER_KEY]: "{not-json" })), null);
  });
});
