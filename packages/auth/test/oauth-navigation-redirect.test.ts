import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isOauthAuthorizeGet,
  wantsBrowserNavigation,
  withOauthNavigationRedirect,
} from "../src/oauth-navigation-redirect.js";

const authorizeUrl =
  "https://dev-api.hosanna.live/api/auth/oauth2/authorize?response_type=code&client_id=x";

describe("wantsBrowserNavigation", () => {
  it("treats Sec-Fetch-Mode navigate / nested-navigate as navigation", () => {
    assert.equal(
      wantsBrowserNavigation(
        new Request(authorizeUrl, { headers: { "sec-fetch-mode": "navigate" } }),
      ),
      true,
    );
    assert.equal(
      wantsBrowserNavigation(
        new Request(authorizeUrl, { headers: { "sec-fetch-mode": "nested-navigate" } }),
      ),
      true,
    );
  });

  it("treats document / iframe / frame destinations as navigation", () => {
    for (const dest of ["document", "iframe", "frame"]) {
      assert.equal(
        wantsBrowserNavigation(new Request(authorizeUrl, { headers: { "sec-fetch-dest": dest } })),
        true,
      );
    }
  });

  it("treats Accept text/html as navigation", () => {
    assert.equal(
      wantsBrowserNavigation(
        new Request(authorizeUrl, {
          headers: { accept: "text/html,application/xhtml+xml" },
        }),
      ),
      true,
    );
  });

  it("keeps cors / no-cors / websocket as fetch even with html Accept", () => {
    for (const mode of ["cors", "no-cors", "websocket"]) {
      assert.equal(
        wantsBrowserNavigation(
          new Request(authorizeUrl, {
            headers: {
              "sec-fetch-mode": mode,
              accept: "text/html",
            },
          }),
        ),
        false,
      );
    }
  });

  it("returns false without navigation hints", () => {
    assert.equal(
      wantsBrowserNavigation(
        new Request(authorizeUrl, { headers: { accept: "application/json" } }),
      ),
      false,
    );
  });
});

describe("isOauthAuthorizeGet", () => {
  it("matches GET and HEAD authorize paths", () => {
    assert.equal(isOauthAuthorizeGet(new Request(authorizeUrl, { method: "GET" })), true);
    assert.equal(isOauthAuthorizeGet(new Request(authorizeUrl, { method: "HEAD" })), true);
    assert.equal(
      isOauthAuthorizeGet(
        new Request("https://x/api/auth/oauth2/authorize/extra", { method: "GET" }),
      ),
      true,
    );
  });

  it("rejects non-GET methods and non-authorize paths", () => {
    assert.equal(isOauthAuthorizeGet(new Request(authorizeUrl, { method: "POST" })), false);
    assert.equal(
      isOauthAuthorizeGet(new Request("https://x/api/auth/oauth2/consent", { method: "GET" })),
      false,
    );
  });
});

describe("withOauthNavigationRedirect", () => {
  const jsonRedirect = {
    redirect: true,
    url: "https://studio.hosanna.live/login?oauth=1",
  };

  it("converts JSON redirect to 302 for navigation clients", async () => {
    const wrapped = withOauthNavigationRedirect(
      async () =>
        new Response(JSON.stringify(jsonRedirect), {
          status: 200,
          headers: {
            "content-type": "application/json",
            "set-cookie": "oauth_state=abc; Path=/; HttpOnly",
          },
        }),
    );

    const res = await wrapped(
      new Request(authorizeUrl, {
        headers: {
          accept: "text/html",
          "sec-fetch-mode": "navigate",
          "sec-fetch-dest": "document",
        },
      }),
    );

    assert.equal(res.status, 302);
    assert.equal(res.headers.get("location"), jsonRedirect.url);
    assert.ok(res.headers.get("set-cookie")?.includes("oauth_state=abc"));
    assert.equal(await res.text(), "");
  });

  it("leaves JSON redirect for cors fetch on non-authorize paths", async () => {
    const wrapped = withOauthNavigationRedirect(
      async () =>
        new Response(JSON.stringify(jsonRedirect), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    );

    const res = await wrapped(
      new Request("https://x/api/auth/oauth2/consent", {
        method: "POST",
        headers: {
          accept: "application/json",
          "sec-fetch-mode": "cors",
        },
      }),
    );

    assert.equal(res.status, 200);
    const body = (await res.json()) as { redirect: boolean; url: string };
    assert.equal(body.redirect, true);
    assert.equal(body.url, jsonRedirect.url);
  });

  it("always converts GET authorize even without navigation hints", async () => {
    const wrapped = withOauthNavigationRedirect(
      async () =>
        new Response(JSON.stringify(jsonRedirect), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    );

    const res = await wrapped(new Request(authorizeUrl, { headers: { accept: "*/*" } }));

    assert.equal(res.status, 302);
    assert.equal(res.headers.get("location"), jsonRedirect.url);
  });

  it("passes through non-200 and non-redirect JSON bodies", async () => {
    const passThrough = withOauthNavigationRedirect(
      async () =>
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    );
    const ok = await passThrough(new Request(authorizeUrl));
    assert.equal(ok.status, 200);
    assert.deepEqual(await ok.json(), { ok: true });

    const errored = withOauthNavigationRedirect(async () => new Response("nope", { status: 500 }));
    const err = await errored(new Request(authorizeUrl));
    assert.equal(err.status, 500);
  });
});
