# @hosanna/calendar

Reusable React event calendar components with day, week, month, year, and agenda views.

```tsx
import { Calendar, type IEvent } from "@hosanna/calendar";
import "@hosanna/calendar/styles.css";

export function Schedule({ events }: { events: IEvent[] }) {
  return (
    <Calendar
      events={events}
      users={[]}
      defaultView="month"
      onEventCreate={event => saveEvent(event)}
      onEventUpdate={event => saveEvent(event)}
    />
  );
}
```

`CalendarProvider` and the individual view components are also exported for custom shells. Events are managed locally by default, while create and update callbacks let an application persist changes.
