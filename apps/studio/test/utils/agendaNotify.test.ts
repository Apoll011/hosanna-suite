import assert from "node:assert/strict";
import test from "node:test";

import type {
  AgendaEvent,
  Assignee,
  Responsibility,
  ResponsibilityCategory,
} from "../../src/types";
import {
  assigneeKey,
  bulletList,
  collectEventMembers,
  collectUnnotifiedAssignments,
  groupAssignees,
  markMembersNotified,
  mergeAssigneeNotificationState,
  responsibilityLabel,
} from "../../src/utils/agendaNotify";

const categories: Record<string, ResponsibilityCategory> = {
  guitar: { id: "guitar", label: "Guitarra", icon: "music", color: "amber" },
  vocals: { id: "vocals", label: "Vocais", icon: "mic", color: "violet" },
  slides: {
    id: "slides",
    label: "Apresentação",
    icon: "monitor",
    color: "sky",
  },
};

const responsibility = (id: string, categoryId: string, assignees: Assignee[]): Responsibility => ({
  id,
  categoryId,
  assignees,
});

const buildEvent = (): AgendaEvent => ({
  id: "evt-1",
  date: "2026-10-04",
  title: "Culto Dominical",
  type: "Culto Dominical",
  time: "10:00",
  durationMinutes: 90,
  reminder: { enabled: false, label: "" },
  responsibilities: [
    responsibility("r1", "guitar", [{ id: "m1", memberId: "m1", name: "Rita", notified: false }]),
    responsibility("r2", "vocals", [
      { id: "m1", memberId: "m1", name: "Rita", notified: false },
      { id: "m2", memberId: "m2", name: "João", notified: true },
    ]),
    // Manually typed assignee — no account to push to.
    responsibility("r3", "slides", [{ id: "manual-1", name: "Convidado" }]),
  ],
});

test("one user with several responsibilities yields ONE aggregated group", () => {
  const groups = collectUnnotifiedAssignments(buildEvent(), categories, "Resp");

  assert.equal(groups.length, 1);
  assert.equal(groups[0].memberId, "m1");
  assert.deepEqual(groups[0].labels, ["Guitarra", "Vocais"]);
});

test("assignments already notified are never re-sent", () => {
  const groups = collectUnnotifiedAssignments(buildEvent(), categories, "Resp");

  // João (m2) is `notified: true`, the manual assignee is unreachable.
  assert.ok(!groups.some((g) => g.memberId === "m2"));
});

test("unreachable (manual) assignees are skipped entirely", () => {
  const event = buildEvent();
  event.responsibilities = [
    responsibility("r3", "slides", [{ id: "manual-1", name: "Convidado" }]),
  ];

  assert.deepEqual(collectUnnotifiedAssignments(event, categories, "Resp"), []);
});

test("isReachable filter excludes members the caller cannot push to", () => {
  const groups = collectUnnotifiedAssignments(
    buildEvent(),
    categories,
    "Resp",
    (memberId) => memberId !== "m1",
  );

  assert.deepEqual(groups, []);
});

test("only members accepted by the API are marked as notified", () => {
  const pending: Responsibility[] = [
    responsibility("r1", "guitar", [
      { id: "m1", memberId: "m1", name: "Rita", notified: false },
      { id: "m2", memberId: "m2", name: "João", notified: false },
    ]),
  ];

  // m1 delivered, m2's FCM send failed.
  const next = markMembersNotified(pending, ["m1"]);

  assert.equal(next[0].assignees[0].notified, true);
  assert.equal(next[0].assignees[1].notified, false);
});

test("marking is a no-op when nothing succeeded", () => {
  const event = buildEvent();

  assert.equal(markMembersNotified(event.responsibilities, []), event.responsibilities);
});

test("a newly assigned person starts pending, even if notified elsewhere", () => {
  const merged = mergeAssigneeNotificationState([], [{ id: "m1", memberId: "m1", name: "Rita" }]);

  assert.equal(merged[0].notified, false);
});

test("people who stay keep their notification state", () => {
  const merged = mergeAssigneeNotificationState(
    [{ id: "m1", memberId: "m1", name: "Rita", notified: true }],
    [
      { id: "m1", memberId: "m1", name: "Rita" },
      { id: "m2", memberId: "m2", name: "João" },
    ],
  );

  assert.equal(merged[0].notified, true);
  assert.equal(merged[1].notified, false);
});

test("removals aggregate every affected member under one label", () => {
  const groups = groupAssignees(
    [
      { id: "m1", memberId: "m1", name: "Rita" },
      { id: "m2", memberId: "m2", name: "João" },
      { id: "manual-1", name: "Convidado" },
    ],
    "Guitarra",
  );

  assert.deepEqual(groups.map((g) => g.memberId).sort(), ["m1", "m2"]);
  assert.ok(groups.every((g) => g.labels.length === 1));
});

test("assigneeKey prefers memberId over display name", () => {
  assert.equal(assigneeKey({ id: "a", memberId: "m1", name: "Rita" }), "member:m1");
  assert.equal(assigneeKey({ id: "b", name: " Convidado " }), "name:convidado");
});

test("responsibilityLabel falls back when category is missing", () => {
  assert.equal(
    responsibilityLabel(responsibility("r1", "unknown", []), categories, "Fallback"),
    "Fallback",
  );
  assert.equal(
    responsibilityLabel(responsibility("r1", "guitar", []), categories, "Fallback"),
    "Guitarra",
  );
});

test("bulletList formats labels for push body content", () => {
  assert.equal(bulletList(["Guitarra", "Vocais"]), "• Guitarra\n• Vocais");
});

test("collectEventMembers returns distinct reachable assignees", () => {
  assert.deepEqual(collectEventMembers(buildEvent()).sort(), ["m1", "m2"]);
});
