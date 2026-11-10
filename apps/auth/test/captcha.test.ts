import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { captchaFetchOptions } from "../lib/captcha.ts";

describe("captchaFetchOptions", () => {
  it("returns undefined when token is missing", () => {
    assert.equal(captchaFetchOptions(undefined), undefined);
  });

  it("returns x-captcha-response header for a token", () => {
    assert.deepEqual(captchaFetchOptions("tok"), {
      headers: { "x-captcha-response": "tok" },
    });
  });
});
