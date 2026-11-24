/**
 * @license
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { RESUME_REFETCH_DEDUPE_MS, createResumeRefetchGate } from "../../src/lib/resumeRefetch";

describe("createResumeRefetchGate", () => {
  it("allows the first refetch", () => {
    const gate = createResumeRefetchGate();
    assert.equal(gate(1_000), true);
  });

  it("drops the paired focus/visibility event inside the window", () => {
    const gate = createResumeRefetchGate();
    assert.equal(gate(1_000), true);
    assert.equal(gate(1_000 + RESUME_REFETCH_DEDUPE_MS - 1), false);
  });

  it("allows another refetch after the window", () => {
    const gate = createResumeRefetchGate();
    assert.equal(gate(1_000), true);
    assert.equal(gate(1_000 + RESUME_REFETCH_DEDUPE_MS), true);
  });

  it("honors a custom window", () => {
    const gate = createResumeRefetchGate(50);
    assert.equal(gate(0), true);
    assert.equal(gate(49), false);
    assert.equal(gate(50), true);
  });
});
