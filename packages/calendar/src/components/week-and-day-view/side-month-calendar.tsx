import React, { useMemo, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import type { AgendaEvent } from "../../interfaces";
import { getEventStart } from "../../helpers";

interface SideMonthCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  events?: AgendaEvent[];
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function SideMonthCalendar({
  selectedDate,
  onSelectDate,
  events = [],
}: SideMonthCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(selectedDate));

  useEffect(() => {
    setCurrentMonth(startOfMonth(selectedDate));
  }, [selectedDate]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Leading empty cells based on first day of week (Sunday = 0)
  const startDayOfWeek = monthStart.getDay();
  const leadingBlanks = Array.from({ length: startDayOfWeek }, (_, i) => i);

  // Set of dates with events in this month
  const markedDatesSet = useMemo(() => {
    const set = new Set<string>();
    for (const ev of events) {
      const d = getEventStart(ev);
      set.add(format(d, "yyyy-MM-dd"));
    }
    return set;
  }, [events]);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleGoToday = () => {
    const today = new Date();
    setCurrentMonth(startOfMonth(today));
    onSelectDate(today);
  };

  return (
    <div className="w-full space-y-2">
      {/* Header: Month Year + Navigation */}
      <div className="flex items-center justify-between px-1">
        <h4 className="text-xs font-bold text-m3-text">{format(currentMonth, "MMMM yyyy")}</h4>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1 rounded-md text-m3-secondary hover:text-m3-text hover:bg-m3-hover cursor-pointer transition-colors"
            title="Previous month"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 rounded-md text-m3-secondary hover:text-m3-text hover:bg-m3-hover cursor-pointer transition-colors"
            title="Next month"
          >
            <ChevronRight className="size-4" />
          </button>
          <button
            type="button"
            onClick={handleGoToday}
            className="ml-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border border-m3-border text-m3-secondary hover:text-m3-text hover:bg-m3-hover cursor-pointer transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 w-full text-center">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-[11px] font-semibold text-m3-secondary py-1">
            {w}
          </div>
        ))}
      </div>

      {/* Days grid - fills full width */}
      <div className="grid grid-cols-7 w-full gap-1">
        {leadingBlanks.map((b) => (
          <div key={`blank-${b}`} className="aspect-square" />
        ))}

        {monthDays.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentDay = isToday(day);
          const dateStr = format(day, "yyyy-MM-dd");
          const hasEvent = markedDatesSet.has(dateStr);

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onSelectDate(day)}
              className={`aspect-square w-full rounded-full flex flex-col items-center justify-center text-xs font-semibold transition-all cursor-pointer relative ${
                isSelected
                  ? "bg-m3-primary text-white shadow-xs"
                  : isCurrentDay
                    ? "border border-m3-primary text-m3-primary hover:bg-m3-primary/10"
                    : "text-m3-text hover:bg-m3-hover"
              }`}
            >
              <span>{format(day, "d")}</span>
              {hasEvent && !isSelected && (
                <span className="absolute bottom-1 size-1 rounded-full bg-m3-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
