import assert from "node:assert/strict";
import test from "node:test";

import {
  getCalendarCells,
  navigateDate,
  rangeText,
  getEventStart,
  getEventEnd,
  getEventColor,
  isWorkingHour,
} from "../src/helpers";
import type { AgendaEvent } from "../src/interfaces";

test("creates a complete month grid", () => {
  const cells = getCalendarCells(new Date(2026, 1, 15));
  assert.equal(cells.length % 7, 0);
  assert.ok(cells.some((cell) => cell.currentMonth && cell.day === 15));
});

test("navigates dates by calendar view", () => {
  const date = new Date(2026, 0, 15);
  assert.equal(navigateDate(date, "month", "next").getMonth(), 1);
  assert.equal(navigateDate(date, "year", "previous").getFullYear(), 2025);
  assert.match(rangeText("day", date), /Jan 15, 2026/);
});

test("correctly parses AgendaEvent start and end dates", () => {
  const event: AgendaEvent = {
    id: "test-1",
    date: "2026-11-21",
    time: "10:30",
    durationMinutes: 90,
    title: "Sunday Morning",
    type: "Culto",
    color: "purple",
    responsibilities: [],
  };

  const start = getEventStart(event);
  assert.equal(start.getFullYear(), 2026);
  assert.equal(start.getMonth(), 10); // Nov = 10
  assert.equal(start.getDate(), 21);
  assert.equal(start.getHours(), 10);
  assert.equal(start.getMinutes(), 30);

  const end = getEventEnd(event);
  assert.equal(end.getHours(), 12);
  assert.equal(end.getMinutes(), 0);

  assert.equal(getEventColor(event), "purple");
});

test("working hours defaults do not prohibit Sundays or noon when undefined", () => {
  const sundayNoon = new Date(2026, 10, 22, 12, 0, 0); // Sunday
  assert.equal(isWorkingHour(sundayNoon, 12, null), true);
  assert.equal(isWorkingHour(sundayNoon, 12, undefined), true);
});
