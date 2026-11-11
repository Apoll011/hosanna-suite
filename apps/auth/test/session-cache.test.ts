import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

function memoryStorage() {
  const map = new Map<string, string>();
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
    clear() {
      map.clear();
    },
  };
}

describe("session-cache", () => {
  const originalWindow = globalThis.window;
  const originalLocalStorage = globalThis.localStorage;

  beforeEach(() => {
    const storage = memoryStorage();
    // @ts-expect-error minimal window for canUseStorage()
    globalThis.window = {};
    // @ts-expect-error minimal localStorage
    globalThis.localStorage = storage;
  });

  afterEach(() => {
    if (originalWindow === undefined) {
      // @ts-expect-error cleanup
      delete globalThis.window;
    } else {
      globalThis.window = originalWindow;
    }
    if (originalLocalStorage === undefined) {
      // @ts-expect-error cleanup
      delete globalThis.localStorage;
    } else {
      globalThis.localStorage = originalLocalStorage;
    }
  });

  it("round-trips user / sessions / accounts / login history and clears all", async () => {
    const {
      clearCachedUser,
      readCachedAccounts,
      readCachedLoginHistory,
      readCachedSessions,
      readCachedUser,
      toCachedUser,
      writeCachedAccounts,
      writeCachedLoginHistory,
      writeCachedSessions,
      writeCachedUser,
    } = await import("../lib/session/cache");

    const user = toCachedUser({
      id: "u1",
      name: "Ada",
      email: "ada@example.com",
      image: null,
      twoFactorEnabled: true,
    });
    writeCachedUser(user);
    assert.deepEqual(readCachedUser(), {
      id: "u1",
      name: "Ada",
      email: "ada@example.com",
      image: null,
      twoFactorEnabled: true,
    });

    writeCachedSessions([
      {
        id: "s1",
        createdAt: "2026-01-01T00:00:00.000Z",
        token: "tok",
        ipAddress: "127.0.0.1",
        userAgent: "test",
      },
    ]);
    assert.equal(readCachedSessions()?.length, 1);
    assert.equal(readCachedSessions()?.[0]?.id, "s1");

    writeCachedAccounts([{ id: "a1", providerId: "google", accountId: "g-1" }]);
    assert.deepEqual(readCachedAccounts(), [{ id: "a1", providerId: "google", accountId: "g-1" }]);

    writeCachedLoginHistory({
      total: 1,
      events: [
        {
          eventKey: "k1",
          eventType: "sign_in",
          createdAt: "2026-01-02T00:00:00.000Z",
        },
      ],
    });
    assert.equal(readCachedLoginHistory()?.total, 1);
    assert.equal(readCachedLoginHistory()?.events[0]?.eventKey, "k1");

    clearCachedUser();
    assert.equal(readCachedUser(), null);
    assert.equal(readCachedSessions(), null);
    assert.equal(readCachedAccounts(), null);
    assert.equal(readCachedLoginHistory(), null);
  });

  it("returns null without window/localStorage", async () => {
    // @ts-expect-error remove doubles
    delete globalThis.window;
    // @ts-expect-error remove doubles
    delete globalThis.localStorage;

    const { readCachedUser, writeCachedUser } = await import("../lib/session/cache");
    writeCachedUser({ id: "u2" });
    assert.equal(readCachedUser(), null);
  });
});
