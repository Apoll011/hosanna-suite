import { isWithinInterval, differenceInDays, startOfDay, endOfDay } from "date-fns";

import { MonthEventBadge } from "../month-view/month-event-badge";
import { getEventStart, getEventEnd } from "../../helpers";

import type { AgendaEvent } from "../../interfaces";

interface IProps {
  selectedDate: Date;
  multiDayEvents: AgendaEvent[];
}

export function DayViewMultiDayEventsRow({ selectedDate, multiDayEvents }: IProps) {
  const dayStart = startOfDay(selectedDate);
  const dayEnd = endOfDay(selectedDate);

  const multiDayEventsInDay = multiDayEvents
    .filter(event => {
      const eventStart = getEventStart(event);
      const eventEnd = getEventEnd(event);

      const isOverlapping =
        isWithinInterval(dayStart, { start: eventStart, end: eventEnd }) ||
        isWithinInterval(dayEnd, { start: eventStart, end: eventEnd }) ||
        (eventStart <= dayStart && eventEnd >= dayEnd);

      return isOverlapping;
    })
    .sort((a, b) => {
      const durationA = differenceInDays(getEventEnd(a), getEventStart(a));
      const durationB = differenceInDays(getEventEnd(b), getEventStart(b));
      return durationB - durationA;
    });

  if (multiDayEventsInDay.length === 0) return null;

  return (
    <div className="flex border-b">
      <div className="w-18"></div>
      <div className="flex flex-1 flex-col gap-1 border-l py-1">
        {multiDayEventsInDay.map(event => {
          const eventStart = startOfDay(getEventStart(event));
          const eventEnd = startOfDay(getEventEnd(event));
          const currentDate = startOfDay(selectedDate);

          const eventTotalDays = differenceInDays(eventEnd, eventStart) + 1;
          const eventCurrentDay = differenceInDays(currentDate, eventStart) + 1;

          return <MonthEventBadge key={event.id} event={event} cellDate={selectedDate} eventCurrentDay={eventCurrentDay} eventTotalDays={eventTotalDays} />;
        })}
      </div>
    </div>
  );
}
