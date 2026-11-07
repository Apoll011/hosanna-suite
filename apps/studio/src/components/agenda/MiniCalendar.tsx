/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TranslationKey, useI18n } from "@/src/lib/i18n";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";

interface MiniCalendarProps {
  visibleMonth: Date;
  selectedDate: string;
  /** Set of yyyy-mm-dd strings that should render a dot indicator. */
  markedDates: Set<string>;
  onSelectDate: (date: string) => void;
  onChangeMonth: (delta: number) => void;
  onGoToday: () => void;
}

const WEEKDAY_KEYS: TranslationKey[] = [
  "agenda.weekdays.mon",
  "agenda.weekdays.tue",
  "agenda.weekdays.wed",
  "agenda.weekdays.thu",
  "agenda.weekdays.fri",
  "agenda.weekdays.sat",
  "agenda.weekdays.sun",
];

const MONTH_KEYS: TranslationKey[] = [
  "agenda.months.january",
  "agenda.months.february",
  "agenda.months.march",
  "agenda.months.april",
  "agenda.months.may",
  "agenda.months.june",
  "agenda.months.july",
  "agenda.months.august",
  "agenda.months.september",
  "agenda.months.october",
  "agenda.months.november",
  "agenda.months.december",
];

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function buildMonthGrid(visibleMonth: Date): (Date | null)[] {
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  // Monday-first offset (getDay(): 0=Sun..6=Sat)
  const offset = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export const MiniCalendar: React.FC<MiniCalendarProps> = ({
  visibleMonth,
  selectedDate,
  markedDates,
  onSelectDate,
  onChangeMonth,
  onGoToday,
}) => {
  const { t } = useI18n();
  const cells = buildMonthGrid(visibleMonth);
  const todayIso = toIso(new Date());

  return (
    <div className="bg-m3-card border border-m3-border rounded-[var(--radius-lg)] p-4 shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-title text-m3-text">
          {t(MONTH_KEYS[visibleMonth.getMonth()])} {visibleMonth.getFullYear()}
        </h3>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => onChangeMonth(-1)}
            className="inline-flex items-center justify-center min-h-10 min-w-10 rounded-[var(--radius-md)] hover:bg-m3-hover text-m3-secondary hover:text-m3-text transition-colors cursor-pointer"
            aria-label={t("agenda.previousMonth")}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onChangeMonth(1)}
            className="inline-flex items-center justify-center min-h-10 min-w-10 rounded-[var(--radius-md)] hover:bg-m3-hover text-m3-secondary hover:text-m3-text transition-colors cursor-pointer"
            aria-label={t("agenda.nextMonth")}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={onGoToday}
            className="ml-1 min-h-10 px-3 text-label rounded-[var(--radius-md)] border border-m3-border text-m3-secondary hover:bg-m3-hover hover:text-m3-text transition-colors cursor-pointer"
          >
            {t("agenda.today")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_KEYS.map((w) => (
          <div key={w} className="text-center text-label py-1">
            {t(w)}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date)
            return <div key={`empty-${i}`} className="aspect-square" />;
          const iso = toIso(date);
          const isSelected = iso === selectedDate;
          const isToday = iso === todayIso;
          const hasMark = markedDates.has(iso);

          return (
            <button
              key={iso}
              onClick={() => onSelectDate(iso)}
              className={`aspect-square min-h-10 rounded-full flex flex-col items-center justify-center text-xs font-semibold transition-colors cursor-pointer relative ${
                isSelected
                  ? "bg-m3-primary text-white shadow-[var(--shadow-sm)]"
                  : isToday
                    ? "border border-m3-primary text-m3-primary"
                    : "text-m3-text hover:bg-m3-hover"
              }`}
            >
              {date.getDate()}
              {hasMark && !isSelected && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-m3-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export { toIso };
