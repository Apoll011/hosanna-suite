import { useCalendar } from "../contexts/calendar-context";

import type { IEvent } from "../interfaces";

export function useUpdateEvent() {
  const { updateEvent: persistEvent } = useCalendar();

  // This is just and example, in a real scenario
  // you would call an API to update the event
  const updateEvent = (event: IEvent) => {
    const newEvent: IEvent = { ...event };

    newEvent.startDate = new Date(event.startDate).toISOString();
    newEvent.endDate = new Date(event.endDate).toISOString();

    persistEvent(newEvent);
  };

  return { updateEvent };
}
