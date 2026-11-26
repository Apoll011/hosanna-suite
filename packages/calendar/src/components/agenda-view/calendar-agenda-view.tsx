// SPDX-License-Identifier: AGPL-3.0-only
import { useMemo } from "react";
import { CalendarX2 } from "lucide-react";
import { format, endOfDay, startOfDay, isSameMonth } from "date-fns";

import { useCalendar } from "../../contexts/calendar-context";

import { ScrollArea } from "../../ui/scroll-area";
import { AgendaDayGroup } from "./agenda-day-group";
import { getEventStart, getEventEnd } from "../../helpers";

import type { AgendaEvent } from "../../interfaces";

interface IProps {
  singleDayEvents: AgendaEvent[];
  multiDayEvents: AgendaEvent[];
}

export function CalendarAgendaView({ singleDayEvents, multiDayEvents }: IProps) {
  const { selectedDate } = useCalendar();

  const eventsByDay = useMemo(() => {
    const allDates = new Map<
      string,
      { date: Date; events: AgendaEvent[]; multiDayEvents: AgendaEvent[] }
    >();

    singleDayEvents.forEach((event) => {
      const eventDate = getEventStart(event);
      if (!isSameMonth(eventDate, selectedDate)) return;

      const dateKey = format(eventDate, "yyyy-MM-dd");

      if (!allDates.has(dateKey)) {
        allDates.set(dateKey, { date: startOfDay(eventDate), events: [], multiDayEvents: [] });
      }

      allDates.get(dateKey)?.events.push(event);
    });

    multiDayEvents.forEach((event) => {
      const eventStart = getEventStart(event);
      const eventEnd = getEventEnd(event);

      let currentDate = startOfDay(eventStart);
      const lastDate = endOfDay(eventEnd);

      while (currentDate <= lastDate) {
        if (isSameMonth(currentDate, selectedDate)) {
          const dateKey = format(currentDate, "yyyy-MM-dd");

          if (!allDates.has(dateKey)) {
            allDates.set(dateKey, { date: new Date(currentDate), events: [], multiDayEvents: [] });
          }

          allDates.get(dateKey)?.multiDayEvents.push(event);
        }

        currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
      }
    });

    return Array.from(allDates.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [singleDayEvents, multiDayEvents, selectedDate]);

  return (
    <ScrollArea className="h-[800px] px-6" type="always">
      {eventsByDay.length > 0 ? (
        <div className="space-y-6 pb-4">
          {eventsByDay.map(({ date, events, multiDayEvents }) => (
            <AgendaDayGroup
              key={date.toISOString()}
              date={date}
              events={events}
              multiDayEvents={multiDayEvents}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
          <CalendarX2 className="size-10 text-m3-secondary" />
          <p className="text-base font-semibold text-m3-text">No events for this month</p>
          <p className="text-xs text-m3-secondary">
            Events scheduled for this month will appear here.
          </p>
        </div>
      )}
    </ScrollArea>
  );
}
