import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveOrgTrialGate } from "../lib/auth/trial-gate";

describe("resolveOrgTrialGate", () => {
  it("lets any org with a subscription row through", () => {
    assert.equal(resolveOrgTrialGate(1, "member"), "subscribed");
    assert.equal(resolveOrgTrialGate(2, "owner"), "subscribed");
  });

  it("offers the trial to owners of an org without a subscription", () => {
    assert.equal(resolveOrgTrialGate(0, "owner"), "trialAvailable");
  });

  it("asks non-owners to involve the owner", () => {
    assert.equal(resolveOrgTrialGate(0, "admin"), "ownerRequired");
    assert.equal(resolveOrgTrialGate(0, "member"), "ownerRequired");
  });

  it("still offers the trial when the role is unknown", () => {
    assert.equal(resolveOrgTrialGate(0, null), "trialAvailable");
  });
});
