import assert from "node:assert/strict";
import test from "node:test";

import { getCalendarCells, navigateDate, rangeText } from "../src/helpers";

test("creates a complete month grid", () => {
  const cells = getCalendarCells(new Date(2026, 1, 15));
  assert.equal(cells.length % 7, 0);
  assert.ok(cells.some(cell => cell.currentMonth && cell.day === 15));
});

test("navigates dates by calendar view", () => {
  const date = new Date(2026, 0, 15);
  assert.equal(navigateDate(date, "month", "next").getMonth(), 1);
  assert.equal(navigateDate(date, "year", "previous").getFullYear(), 2025);
  assert.match(rangeText("day", date), /Jan 15, 2026/);
});
