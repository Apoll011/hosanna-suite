import { Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";
import { Calendar, type IEvent, type IUser } from "@hosanna/calendar";

const users: IUser[] = [
  { id: "ana", name: "Ana Martins", picturePath: null },
  { id: "joao", name: "Joao Silva", picturePath: null },
  { id: "marina", name: "Marina Costa", picturePath: null },
];

function at(dayOffset: number, hour: number, minute = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

const initialEvents: IEvent[] = [
  {
    id: "worship-rehearsal",
    title: "Worship rehearsal",
    description: "Run through the Sunday set and transitions.",
    color: "blue",
    startDate: at(1, 18),
    endDate: at(1, 19, 30),
    user: users[0],
  },
  {
    id: "team-prayer",
    title: "Team prayer",
    description: "A quiet start to the week with the service team.",
    color: "purple",
    startDate: at(2, 8, 30),
    endDate: at(2, 9, 15),
    user: users[1],
  },
  {
    id: "setlist-review",
    title: "Setlist review",
    description: "Review keys, arrangements, and song transitions.",
    color: "green",
    startDate: at(3, 14),
    endDate: at(3, 15),
    user: users[2],
  },
  {
    id: "sunday-service",
    title: "Sunday service",
    description: "Main gathering, volunteers arrive 45 minutes early.",
    color: "orange",
    startDate: at(5, 9),
    endDate: at(5, 12),
    user: users[0],
  },
  {
    id: "new-songs",
    title: "New song workshop",
    description: "Learn two new songs for the next month.",
    color: "red",
    startDate: at(7, 19),
    endDate: at(7, 20, 30),
    user: users[1],
  },
];

export function CalendarPage() {
  const [events, setEvents] = useState(initialEvents);
  const handleCreate = (event: IEvent) => setEvents(previous => [...previous, event]);
  const handleUpdate = (event: IEvent) => setEvents(previous => previous.map(current => (current.id === event.id ? event : current)));

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto bg-m3-bg px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5">
        <header className="flex items-end justify-between">
          <div>
            <h1 className="text-display text-m3-text">Calendar</h1>
            <p className="mt-1 text-sm text-m3-secondary">Rehearsals, services, and the people making each gathering happen.</p>
          </div>
        </header>

        <section className="min-h-[680px] overflow-hidden rounded-lg border border-m3-border bg-m3-card">
          <Calendar events={events} users={users} defaultView="month" onEventCreate={handleCreate} onEventUpdate={handleUpdate} />
        </section>
      </div>
    </div>
  );
}
