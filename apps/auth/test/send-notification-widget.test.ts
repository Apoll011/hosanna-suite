import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMentionCandidates,
  buildNotificationPayloads,
  filterMentionCandidates,
  serializeComposerMessage,
  type ComposerPart,
} from "../components/dashboard/sendNotificationModel";

test("buildMentionCandidates puts @All first, then teams, then deduplicated members", () => {
  const candidates = buildMentionCandidates({
    allLabel: "All",
    teams: [{ id: "t1", name: "Worship Team", memberCount: 4 }],
    members: [
      { userId: "u1", user: { name: "Nour Adel", email: "nour@example.com" } },
      { userId: "u1", user: { name: "Nour Adel", email: "nour@example.com" } },
      { userId: "u2", user: { name: null, email: "maya@example.com" } },
    ],
  });

  assert.equal(candidates.length, 4);
  assert.deepEqual(candidates[0], { kind: "all", id: "all", label: "All" });
  assert.deepEqual(candidates[1], {
    kind: "team",
    id: "t1",
    label: "Worship Team",
    memberCount: 4,
  });
  assert.equal(candidates[2].id, "u1");
  assert.equal(candidates[3].label, "maya@example.com");
});

test("filterMentionCandidates matches @All, team names, and member names/emails", () => {
  const candidates = buildMentionCandidates({
    allLabel: "Todos",
    teams: [{ id: "t1", name: "Sound Crew" }],
    members: [{ userId: "u1", user: { name: "Noah Kim", email: "noah@church.org" } }],
  });

  assert.equal(filterMentionCandidates(candidates, "all")[0]?.kind, "all");
  assert.equal(filterMentionCandidates(candidates, "sound")[0]?.id, "t1");
  assert.equal(filterMentionCandidates(candidates, "kim")[0]?.id, "u1");
  assert.equal(filterMentionCandidates(candidates, "noah@")[0]?.id, "u1");
  assert.equal(filterMentionCandidates(candidates, "zzz").length, 0);
});

test("serializeComposerMessage deduplicates targets and collapses @All to organization broadcast", () => {
  const parts: ComposerPart[] = [
    { t: "text", s: "Please " },
    { t: "chip", id: "c1", target: { kind: "all", id: "all", label: "All" } },
    { t: "text", s: " bring an A4 paper " },
    { t: "chip", id: "c2", target: { kind: "user", id: "u1", label: "Noah Kim" } },
  ];

  const serialized = serializeComposerMessage(parts);
  assert.equal(serialized.text, "Please @All bring an A4 paper @Noah");
  assert.equal(serialized.targets.length, 1);
  assert.equal(serialized.targets[0]?.kind, "all");
});

test("buildNotificationPayloads creates one payload per unique team/user with selected channels", () => {
  const payloads = buildNotificationPayloads({
    organizationId: "org_1",
    text: "Please @Worship Team and @Noah bring A4 paper on Sunday",
    targets: [
      { kind: "team", id: "t1", label: "Worship Team" },
      { kind: "user", id: "u1", label: "Noah Kim" },
    ],
    channels: ["inbox", "push", "email"],
  });

  assert.equal(payloads.length, 2);
  assert.deepEqual(payloads[0], {
    type: "info",
    title: "Please @Worship Team and @Noah bring A4 paper on Sunday",
    channels: ["inbox", "push", "email"],
    teamId: "t1",
  });
  assert.deepEqual(payloads[1], {
    type: "info",
    title: "Please @Worship Team and @Noah bring A4 paper on Sunday",
    channels: ["inbox", "push", "email"],
    userId: "u1",
  });
});
