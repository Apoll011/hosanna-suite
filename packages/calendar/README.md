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
      onEventCreate={(event) => saveEvent(event)}
      onEventUpdate={(event) => saveEvent(event)}
    />
  );
}
```

`CalendarProvider` and the individual view components are also exported for custom shells. Events are managed locally by default, while create and update callbacks let an application persist changes.

## License

[![AGPL-3.0-only](https://img.shields.io/badge/License-AGPL--3.0--only-blue.svg)](../../LICENSE.md)

Licensed under AGPL-3.0-only. If a modified copy is used over a network, users must be offered its corresponding source code. See the [license](../../LICENSE.md) and [contribution guide](../../CONTRIBUTING.md).
