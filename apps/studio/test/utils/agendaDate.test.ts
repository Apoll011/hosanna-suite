import assert from "node:assert/strict";
import test from "node:test";

import { formatLongDate, formatShortDate } from "../../src/utils/agendaDate";

/** Minimal `t` — returns the key, or interpolates `{param}` placeholders when present. */
const t = (key: string, params?: Record<string, string | number>): string => {
  if (!params) return key;
  // Prefer simple interpolation so assertions stay readable.
  if (key === "agenda.dateLong") {
    return `${params.weekday}, ${params.day} de ${params.month} de ${params.year}`;
  }
  if (key === "agenda.dateShort") {
    return `${params.day}/${params.month}/${params.year}`;
  }
  return key;
};

test("formatLongDate localizes weekday, day, month, and year", () => {
  // 2026-10-04 is a Sunday.
  assert.equal(
    formatLongDate("2026-10-04", t as never),
    "agenda.weekdaysFull.sunday, 4 de agenda.months.october de 2026",
  );
});

test("formatShortDate pads day and month", () => {
  assert.equal(formatShortDate("2026-10-04", t as never), "04/10/2026");
  assert.equal(formatShortDate("2026-01-09", t as never), "09/01/2026");
});

test("formatShortDate accepts ISO datetime strings", () => {
  assert.equal(formatShortDate("2026-10-04T10:00:00.000Z", t as never), "04/10/2026");
});

test("formatShortDate returns empty or raw input when invalid", () => {
  assert.equal(formatShortDate("", t as never), "");
  assert.equal(formatShortDate("not-a-date", t as never), "not-a-date");
  assert.equal(formatShortDate("2026", t as never), "2026");
});
