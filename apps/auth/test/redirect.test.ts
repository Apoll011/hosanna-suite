import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import {
  getStudioUrl,
  isSafeRedirectTarget,
  readRedirectParam,
  resolveSocialCallbackURL,
} from "../lib/redirect.ts";

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

describe("isSafeRedirectTarget", () => {
  it("allows same-origin relative paths", () => {
    assert.equal(isSafeRedirectTarget("/onboarding"), true);
    assert.equal(isSafeRedirectTarget("/account/settings"), true);
  });

  it("rejects empty, whitespace, and protocol-relative URLs", () => {
    assert.equal(isSafeRedirectTarget(""), false);
    assert.equal(isSafeRedirectTarget("   "), false);
    assert.equal(isSafeRedirectTarget("//evil.example/phish"), false);
  });

  it("allows http(s) absolute URLs", () => {
    assert.equal(isSafeRedirectTarget("https://studio.hosanna.live/org"), true);
    assert.equal(isSafeRedirectTarget("http://localhost:5173/"), true);
  });

  it("rejects non-http schemes and garbage", () => {
    assert.equal(isSafeRedirectTarget("javascript:alert(1)"), false);
    assert.equal(isSafeRedirectTarget("not a url"), false);
  });
});

describe("readRedirectParam", () => {
  it("reads redirect and returnUrl when safe", () => {
    assert.equal(
      readRedirectParam(new URLSearchParams("redirect=%2Faccount")),
      "/account",
    );
    assert.equal(
      readRedirectParam(new URLSearchParams("returnUrl=https%3A%2F%2Fstudio.hosanna.live%2Fx")),
      "https://studio.hosanna.live/x",
    );
  });

  it("returns null when missing or unsafe", () => {
    assert.equal(readRedirectParam(new URLSearchParams("")), null);
    assert.equal(
      readRedirectParam(new URLSearchParams("redirect=javascript%3Aalert(1)")),
      null,
    );
    assert.equal(readRedirectParam(new URLSearchParams("redirect=%2F%2Fevil.test")), null);
  });

  it("prefers redirect over returnUrl", () => {
    assert.equal(
      readRedirectParam(new URLSearchParams("redirect=%2Fa&returnUrl=%2Fb")),
      "/a",
    );
  });
});

describe("getStudioUrl", () => {
  const original = process.env.NEXT_PUBLIC_STUDIO_URL;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.NEXT_PUBLIC_STUDIO_URL;
    } else {
      process.env.NEXT_PUBLIC_STUDIO_URL = original;
    }
  });

  it("defaults to production studio origin", () => {
    delete process.env.NEXT_PUBLIC_STUDIO_URL;
    assert.equal(getStudioUrl(), "https://studio.hosanna.live");
  });

  it("uses NEXT_PUBLIC_STUDIO_URL and strips trailing slashes", () => {
    process.env.NEXT_PUBLIC_STUDIO_URL = "https://dev-studio.hosanna.live///";
    assert.equal(getStudioUrl(), "https://dev-studio.hosanna.live");
  });
});

describe("resolveSocialCallbackURL", () => {
  const originalWindow = globalThis.window;
  const originalLocalStorage = globalThis.localStorage;
  const originalStudio = process.env.NEXT_PUBLIC_STUDIO_URL;

  afterEach(() => {
    if (originalWindow === undefined) {
      // @ts-expect-error cleanup test double
      delete globalThis.window;
    } else {
      globalThis.window = originalWindow;
    }
    if (originalLocalStorage === undefined) {
      // @ts-expect-error cleanup test double
      delete globalThis.localStorage;
    } else {
      globalThis.localStorage = originalLocalStorage;
    }
    if (originalStudio === undefined) {
      delete process.env.NEXT_PUBLIC_STUDIO_URL;
    } else {
      process.env.NEXT_PUBLIC_STUDIO_URL = originalStudio;
    }
  });

  function installDom(origin = "https://auth.hosanna.live") {
    const storage = memoryStorage();
    // @ts-expect-error minimal window for pure redirect helpers
    globalThis.window = { location: { origin } };
    // @ts-expect-error minimal localStorage
    globalThis.localStorage = storage;
    return storage;
  }

  it("uses a safe absolute override as-is", () => {
    installDom();
    assert.equal(
      resolveSocialCallbackURL(undefined, "https://studio.hosanna.live/org"),
      "https://studio.hosanna.live/org",
    );
  });

  it("prefixes relative override with window.origin", () => {
    installDom("https://auth.hosanna.live");
    assert.equal(
      resolveSocialCallbackURL(undefined, "/onboarding"),
      "https://auth.hosanna.live/onboarding",
    );
  });

  it("honors redirect search param", () => {
    installDom("https://auth.hosanna.live");
    assert.equal(
      resolveSocialCallbackURL(new URLSearchParams("redirect=%2Faccount")),
      "https://auth.hosanna.live/account",
    );
  });

  it("falls back to studio with stored org slug", () => {
    const storage = installDom();
    delete process.env.NEXT_PUBLIC_STUDIO_URL;
    storage.setItem("active_org_slug", "grace");
    assert.equal(resolveSocialCallbackURL(), "https://studio.hosanna.live/grace");
  });

  it("falls back to onboarding when no slug", () => {
    installDom("https://auth.hosanna.live");
    assert.equal(resolveSocialCallbackURL(), "https://auth.hosanna.live/onboarding");
  });
});
