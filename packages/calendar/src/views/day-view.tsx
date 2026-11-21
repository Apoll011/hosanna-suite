"use client";

import { useCalendar } from "../contexts/calendar-context";

export function DayView() {
  const { selectedDate, events, clickEvent } = useCalendar();
  const key = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
  const dayEvents = events.filter(event => event.date === key).sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="divide-y divide-m3-border px-4">
      {dayEvents.map(event => (
        <button key={event.id} type="button" onClick={() => clickEvent?.(event)} className="flex w-full items-start gap-4 py-3 text-left hover:bg-m3-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-m3-primary">
          <span className="tabular-nums w-14 text-xs text-m3-secondary">{event.time}</span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-m3-text">{event.title}</span>
            {event.location && <span className="block truncate text-xs text-m3-secondary">{event.location}</span>}
            {event.responsibilities.length > 0 && <span className="mt-1 block text-xs text-m3-secondary">{event.responsibilities.length} responsibility{event.responsibilities.length === 1 ? "" : "ies"}</span>}
          </span>
        </button>
      ))}
      {dayEvents.length === 0 && <p className="py-12 text-center text-sm text-m3-secondary">No events scheduled</p>}
    </div>
  );
}
