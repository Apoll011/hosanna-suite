import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseUserAgent } from "../lib/parse-user-agent";

describe("parseUserAgent", () => {
  it("returns unknown for null/empty", () => {
    for (const value of [null, undefined, ""]) {
      assert.deepEqual(parseUserAgent(value), {
        client: null,
        os: null,
        device: null,
        deviceType: "unknown",
        isApp: false,
      });
    }
  });

  it("parses Flutter Hosanna UA", () => {
    const parsed = parseUserAgent("Hosanna/1.0.4 (Android 14 (API 34); Pixel 8) Flutter/3.47.2");
    assert.equal(parsed.client, "Hosanna 1.0.4");
    assert.equal(parsed.os, "Android 14");
    assert.equal(parsed.device, "Pixel 8");
    assert.equal(parsed.deviceType, "mobile");
    assert.equal(parsed.isApp, true);
  });

  it("parses Chrome on Linux desktop", () => {
    const parsed = parseUserAgent(
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36",
    );
    assert.equal(parsed.client, "Chrome 151");
    assert.equal(parsed.os, "Linux");
    assert.equal(parsed.device, null);
    assert.equal(parsed.deviceType, "desktop");
    assert.equal(parsed.isApp, false);
  });

  it("parses iPhone Safari", () => {
    const parsed = parseUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
    );
    assert.equal(parsed.client, "Safari 17.4");
    assert.equal(parsed.os, "iOS 17.4");
    assert.equal(parsed.device, "iPhone");
    assert.equal(parsed.deviceType, "mobile");
    assert.equal(parsed.isApp, false);
  });

  it("parses iPad Safari", () => {
    const parsed = parseUserAgent(
      "Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
    );
    assert.equal(parsed.client, "Safari 17.4");
    assert.equal(parsed.device, "iPad");
    assert.equal(parsed.deviceType, "tablet");
    assert.equal(parsed.isApp, false);
  });

  it("parses Windows Chrome", () => {
    const parsed = parseUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    );
    assert.equal(parsed.client, "Chrome 128");
    assert.equal(parsed.os, "Windows 10");
    assert.equal(parsed.deviceType, "desktop");
    assert.equal(parsed.isApp, false);
  });

  it("parses Edge", () => {
    const parsed = parseUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.0.0",
    );
    assert.equal(parsed.client, "Edge 128");
    assert.equal(parsed.os, "Windows 10");
  });

  it("parses Firefox", () => {
    const parsed = parseUserAgent(
      "Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0",
    );
    assert.equal(parsed.client, "Firefox 128");
    assert.equal(parsed.os, "Linux");
    assert.equal(parsed.deviceType, "desktop");
  });
});
