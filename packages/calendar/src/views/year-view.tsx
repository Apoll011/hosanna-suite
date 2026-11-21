"use client";

import { useCalendar } from "../contexts/calendar-context";

export function YearView() {
  const { selectedDate, events, setSelectedDate, clickEvent } = useCalendar();
  const months = Array.from({ length: 12 }, (_, month) => new Date(selectedDate.getFullYear(), month, 1));

  return (
    <div className="grid grid-cols-1 gap-px bg-m3-border sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {months.map(month => {
        const monthEvents = events.filter(event => {
          const date = new Date(`${event.date}T${event.time}:00`);
          return date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth();
        });
        return (
          <button
            key={month.getMonth()}
            type="button"
            onClick={() => setSelectedDate(month)}
            className="min-h-32 bg-m3-card p-3 text-left hover:bg-m3-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-m3-primary"
          >
            <span className="text-sm font-semibold text-m3-text">{month.toLocaleDateString(undefined, { month: "long" })}</span>
            <span className="mt-2 block text-xs text-m3-secondary">{monthEvents.length} event{monthEvents.length === 1 ? "" : "s"}</span>
            <div className="mt-2 space-y-1">
              {monthEvents.slice(0, 3).map(event => (
                <span key={event.id} role="button" tabIndex={0} onClick={(eventClick) => { eventClick.stopPropagation(); clickEvent?.(event); }} className="block truncate text-xs text-m3-primary">{event.date.slice(-2)} {event.time} {event.title}</span>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}
