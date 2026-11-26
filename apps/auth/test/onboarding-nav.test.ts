// SPDX-License-Identifier: AGPL-3.0-only
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { onboardingNavLinks } from "../lib/auth/onboarding-nav";

describe("onboardingNavLinks", () => {
  it("offers only Account when the user has no organization", () => {
    assert.deepEqual(
      onboardingNavLinks(0).map((link) => link.href),
      ["/account"],
    );
  });

  it("offers Home and Account once the user has an organization", () => {
    assert.deepEqual(
      onboardingNavLinks(2).map((link) => link.href),
      ["/home", "/account"],
    );
  });
});
