"use client";

import { useMemo } from "react";
import { useCalendar } from "../contexts/calendar-context";

export function AgendaView() {
  const { selectedDate, events, clickEvent } = useCalendar();
  const monthEvents = useMemo(() => events.filter(event => {
    const date = new Date(`${event.date}T${event.time}:00`);
    return date.getFullYear() === selectedDate.getFullYear() && date.getMonth() === selectedDate.getMonth();
  }).sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)), [events, selectedDate]);

  const grouped = useMemo(() => {
    const groups = new Map<string, typeof monthEvents>();
    monthEvents.forEach(event => groups.set(event.date, [...(groups.get(event.date) ?? []), event]));
    return [...groups.entries()];
  }, [monthEvents]);

  return (
    <div className="divide-y divide-m3-border px-4">
      {grouped.map(([date, dayEvents]) => (
        <section key={date} className="grid gap-3 py-4 sm:grid-cols-[120px_1fr]">
          <p className="text-sm font-semibold text-m3-text">{date}</p>
          <div className="space-y-2">
            {dayEvents.map(event => (
              <button key={event.id} type="button" onClick={() => clickEvent?.(event)} className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-m3-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-m3-primary">
                <span className="tabular-nums w-14 text-xs text-m3-secondary">{event.time}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-m3-text">{event.title}</span>
                {event.responsibilities.length > 0 && <span className="text-xs text-m3-secondary">{event.responsibilities.length}</span>}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
