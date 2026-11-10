import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isTrustedCorsOrigin, withAuthCors } from "../src/cors.js";

describe("isTrustedCorsOrigin", () => {
  it("allows studio and auth hosts", () => {
    assert.equal(isTrustedCorsOrigin("https://dev-studio.hosanna.live"), true);
    assert.equal(isTrustedCorsOrigin("https://studio.hosanna.live"), true);
    assert.equal(isTrustedCorsOrigin("https://auth.hosanna.live"), true);
    assert.equal(isTrustedCorsOrigin("http://localhost:5173"), true);
  });

  it("rejects unrelated origins", () => {
    assert.equal(isTrustedCorsOrigin("https://evil.example"), false);
    assert.equal(isTrustedCorsOrigin("not-a-url"), false);
  });
});

describe("withAuthCors", () => {
  it("answers OPTIONS preflight with credentialed ACAO", async () => {
    const wrapped = withAuthCors(async () => new Response("nope", { status: 500 }));
    const res = await wrapped(
      new Request("https://auth.hosanna.live/api/auth/get-session", {
        method: "OPTIONS",
        headers: {
          Origin: "https://dev-studio.hosanna.live",
          "Access-Control-Request-Method": "GET",
          "Access-Control-Request-Headers": "content-type",
        },
      }),
    );
    assert.equal(res.status, 204);
    assert.equal(res.headers.get("Access-Control-Allow-Origin"), "https://dev-studio.hosanna.live");
    assert.equal(res.headers.get("Access-Control-Allow-Credentials"), "true");
    assert.equal(res.headers.get("Access-Control-Allow-Headers"), "content-type");
  });

  it("adds CORS headers to handler responses", async () => {
    const wrapped = withAuthCors(
      async () =>
        new Response(JSON.stringify(null), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    );
    const res = await wrapped(
      new Request("https://auth.hosanna.live/api/auth/get-session", {
        method: "GET",
        headers: { Origin: "https://dev-studio.hosanna.live" },
      }),
    );
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("Access-Control-Allow-Origin"), "https://dev-studio.hosanna.live");
    assert.equal(res.headers.get("Access-Control-Allow-Credentials"), "true");
    assert.equal(await res.text(), "null");
  });
});
