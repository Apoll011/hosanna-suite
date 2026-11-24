import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canManageTeam } from "../src/authorization/teamPolicy.js";

describe("canManageTeam", () => {
  it("allows owners and admins to manage teams", () => {
    for (const role of ["owner", "admin"]) {
      assert.equal(canManageTeam({ role, action: "create" }), true);
      assert.equal(canManageTeam({ role, action: "update" }), true);
      assert.equal(canManageTeam({ role, action: "delete" }), true);
    }
  });

  it("allows team leaders to create teams and manage only teams they belong to", () => {
    assert.equal(canManageTeam({ role: "teamLeader", action: "create" }), true);
    assert.equal(canManageTeam({ role: "teamLeader", action: "update", isTeamMember: true }), true);
    assert.equal(
      canManageTeam({ role: "teamLeader", action: "update", isTeamMember: false }),
      false,
    );
    assert.equal(
      canManageTeam({ role: "teamLeader", action: "delete", isTeamMember: true }),
      false,
    );
  });

  it("denies team management to unrelated organization roles", () => {
    assert.equal(canManageTeam({ role: "editor", action: "create" }), false);
    assert.equal(canManageTeam({ role: "musician", action: "update", isTeamMember: true }), false);
    assert.equal(canManageTeam({ role: "guest", action: "delete" }), false);
    assert.equal(canManageTeam({ role: "custom", action: "update", isTeamMember: true }), false);
  });
});
