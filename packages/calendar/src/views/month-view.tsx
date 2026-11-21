"use client";

import { useMemo } from "react";
import { useCalendar } from "../contexts/calendar-context";

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function MonthView({ onDateClick }: { onDateClick?: (date: Date) => void }) {
  const { selectedDate, events, setSelectedDate, clickEvent } = useCalendar();

  const cells = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const first = new Date(year, month, 1);
    const firstOffset = first.getDay();
    const days = new Date(year, month + 1, 0).getDate();
    const total = firstOffset + days;
    const nextCount = (7 - (total % 7)) % 7;

    return Array.from({ length: firstOffset + days + nextCount }, (_, index) => {
      const day = index - firstOffset + 1;
      return new Date(year, month, day);
    });
  }, [selectedDate]);

  return (
    <div>
      <div className="grid grid-cols-7 divide-x divide-m3-border border-b border-m3-border">
        {WEEK_DAYS.map(day => <div key={day} className="py-2 text-center text-xs font-medium text-m3-secondary">{day}</div>)}
      </div>
      <div className="grid grid-cols-7 divide-x divide-m3-border">
        {cells.map(date => {
          const key = dateKey(date);
          const dayEvents = events.filter(event => event.date === key).sort((a, b) => a.time.localeCompare(b.time));
          const inMonth = date.getMonth() === selectedDate.getMonth();
          return (
            <button
              type="button"
              key={key}
              onClick={() => { setSelectedDate(date); onDateClick?.(date); }}
              className="flex h-28 flex-col items-stretch gap-1 border-b border-m3-border p-2 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-m3-primary"
            >
              <span className={`flex size-6 items-center justify-center rounded-md text-xs font-semibold ${inMonth ? "text-m3-text" : "text-m3-secondary opacity-50"}`}>{date.getDate()}</span>
              <div className="min-h-0 space-y-1 overflow-hidden">
                {dayEvents.slice(0, 3).map(event => (
                  <span
                    key={event.id}
                    role="button"
                    tabIndex={0}
                    onClick={(eventClick) => { eventClick.stopPropagation(); clickEvent?.(event); }}
                    onKeyDown={(keyboardEvent) => { if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") { keyboardEvent.preventDefault(); clickEvent?.(event); } }}
                    className="block truncate rounded-md bg-m3-primary/10 px-2 py-1 text-xs font-medium text-m3-primary"
                  >
                    {event.time} {event.title}
                  </span>
                ))}
                {dayEvents.length > 3 && <span className="block px-1 text-xs text-m3-secondary">+{dayEvents.length - 3} more</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
