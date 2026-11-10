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

describe("org-cache", () => {
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

  it("round-trips active org and org list, then clears", async () => {
    const {
      clearCachedOrg,
      readCachedActiveOrg,
      readCachedOrgList,
      writeCachedActiveOrg,
      writeCachedOrgList,
    } = await import("../lib/org-cache");

    writeCachedActiveOrg({
      id: "o1",
      name: "Grace",
      slug: "grace",
      logo: null,
      members: [{ id: "m1", userId: "u1", role: "owner" }],
    });
    assert.equal(readCachedActiveOrg()?.slug, "grace");
    assert.equal(readCachedActiveOrg()?.members?.[0]?.role, "owner");

    writeCachedOrgList([
      { id: "o1", name: "Grace", slug: "grace" },
      { id: "o2", name: "Hope", slug: "hope", logo: "https://x/y.png" },
    ]);
    assert.equal(readCachedOrgList()?.length, 2);

    writeCachedActiveOrg(null);
    assert.equal(readCachedActiveOrg(), null);
    assert.equal(readCachedOrgList()?.length, 2);

    clearCachedOrg();
    assert.equal(readCachedActiveOrg(), null);
    assert.equal(readCachedOrgList(), null);
  });

  it("rejects incomplete active org payloads", async () => {
    const { readCachedActiveOrg } = await import("../lib/org-cache");
    localStorage.setItem(
      "hosanna.auth.cached_active_org",
      JSON.stringify({ id: "o1", name: "Missing slug" }),
    );
    assert.equal(readCachedActiveOrg(), null);
  });
});
