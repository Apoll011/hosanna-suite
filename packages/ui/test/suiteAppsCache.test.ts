import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";

import {
  loadSuiteApps,
  peekSuiteAppsCache,
  resetSuiteAppsCacheForTests,
} from "../src/suiteAppsCache";

describe("suiteAppsCache", () => {
  afterEach(() => {
    resetSuiteAppsCacheForTests();
    mock.restoreAll();
  });

  it("shares one in-flight fetch and remembers the result", async () => {
    let calls = 0;
    mock.method(globalThis, "fetch", async () => {
      calls += 1;
      return new Response(
        JSON.stringify({
          apps: [
            {
              id: "music",
              name: "Music",
              shortName: "Music",
              logoUrl: "https://auth.example/favicon.png",
              homeUrl: "https://studio.example",
              status: "live",
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });

    const url = "https://auth.example/api/suite/apps";
    const [a, b] = await Promise.all([loadSuiteApps(url), loadSuiteApps(url)]);
    assert.equal(calls, 1);
    assert.equal(a[0]?.id, "music");
    assert.equal(b[0]?.id, "music");
    assert.equal(peekSuiteAppsCache(url)?.[0]?.id, "music");

    const again = await loadSuiteApps(url);
    assert.equal(calls, 1);
    assert.equal(again[0]?.id, "music");
  });
});
