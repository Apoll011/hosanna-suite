import { useCalendar } from "../contexts/calendar-context";
import { getEventStart, getEventEnd } from "../helpers";

import type { AgendaEvent } from "../interfaces";

export function useUpdateEvent() {
  const { updateEvent: persistEvent } = useCalendar();

  const updateEvent = (event: AgendaEvent) => {
    const newEvent: AgendaEvent = { ...event };
    newEvent.startDate = getEventStart(event).toISOString();
    newEvent.endDate = getEventEnd(event).toISOString();

    persistEvent(newEvent);
  };

  return { updateEvent };
}
