// SPDX-License-Identifier: AGPL-3.0-only
import { differenceInDays, format, startOfDay } from "date-fns";

import { AgendaEventCard } from "./agenda-event-card";
import { getEventStart, getEventEnd } from "../../helpers";

import type { AgendaEvent } from "../../interfaces";

interface IProps {
  date: Date;
  events: AgendaEvent[];
  multiDayEvents: AgendaEvent[];
}

export function AgendaDayGroup({ date, events, multiDayEvents }: IProps) {
  const sortedEvents = [...events].sort(
    (a, b) => getEventStart(a).getTime() - getEventStart(b).getTime(),
  );

  return (
    <div className="space-y-4">
      <div className="sticky top-0 flex items-center gap-4 bg-m3-card py-2 border-b border-m3-border/50">
        <p className="text-sm font-semibold text-m3-text">{format(date, "EEEE, MMMM d, yyyy")}</p>
      </div>

      <div className="space-y-2">
        {multiDayEvents.length > 0 &&
          multiDayEvents.map((event) => {
            const eventStart = startOfDay(getEventStart(event));
            const eventEnd = startOfDay(getEventEnd(event));
            const currentDate = startOfDay(date);

            const eventTotalDays = differenceInDays(eventEnd, eventStart) + 1;
            const eventCurrentDay = differenceInDays(currentDate, eventStart) + 1;
            return (
              <AgendaEventCard
                key={event.id}
                event={event}
                eventCurrentDay={eventCurrentDay}
                eventTotalDays={eventTotalDays}
              />
            );
          })}

        {sortedEvents.length > 0 &&
          sortedEvents.map((event) => <AgendaEventCard key={event.id} event={event} />)}
      </div>
    </div>
  );
}
