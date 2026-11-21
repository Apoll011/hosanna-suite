"use client";

import { useCalendar } from "../contexts/calendar-context";

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function WeekView() {
  const { selectedDate, events, clickEvent } = useCalendar();
  const start = new Date(selectedDate);
  start.setDate(selectedDate.getDate() - selectedDate.getDay());
  start.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 7 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));

  return (
    <div className="grid grid-cols-1 divide-y divide-m3-border sm:grid-cols-7 sm:divide-x sm:divide-y-0">
      {days.map(date => {
        const key = dateKey(date);
        const dayEvents = events.filter(event => event.date === key).sort((a, b) => a.time.localeCompare(b.time));
        return (
          <section key={key} className="min-h-96 p-2">
            <p className="mb-2 text-xs font-semibold text-m3-secondary">{date.toLocaleDateString(undefined, { weekday: "short" })} {date.getDate()}</p>
            <div className="space-y-1">
              {dayEvents.map(event => (
                <button key={event.id} type="button" onClick={() => clickEvent?.(event)} className="w-full rounded-md border-l-2 border-m3-primary bg-m3-primary/10 px-2 py-1.5 text-left text-xs text-m3-text hover:bg-m3-primary/15">
                  <span className="block tabular-nums text-m3-secondary">{event.time}</span>
                  <span className="block truncate font-medium">{event.title}</span>
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
