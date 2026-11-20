import { Calendar as CalendarIcon, Circle, Clock3, Users } from "lucide-react";
import { useMemo, useState } from "react";
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
  const eventCount = events.length;
  const upcoming = useMemo(
    () => events.filter(event => new Date(event.startDate).getTime() >= Date.now()).sort((a, b) => a.startDate.localeCompare(b.startDate))[0],
    [events],
  );

  const handleCreate = (event: IEvent) => setEvents(previous => [...previous, event]);
  const handleUpdate = (event: IEvent) => setEvents(previous => previous.map(current => (current.id === event.id ? event : current)));

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto bg-m3-bg px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-label text-m3-primary">
              <CalendarIcon className="size-4" aria-hidden="true" />
              <span>Planning calendar</span>
            </div>
            <h1 className="text-display text-m3-text">Keep the week in view.</h1>
            <p className="mt-1 max-w-xl text-sm text-m3-secondary">Rehearsals, services, and the people making each gathering happen.</p>
          </div>

          <div className="flex items-center gap-2 text-caption text-m3-secondary">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-m3-border bg-m3-card px-3 py-1.5">
              <Circle className="size-2.5 fill-m3-primary text-m3-primary" aria-hidden="true" />
              {eventCount} scheduled
            </span>
            <span className="hidden items-center gap-1.5 rounded-full border border-m3-border bg-m3-card px-3 py-1.5 sm:inline-flex">
              <Users className="size-3.5" aria-hidden="true" />
              {users.length} people
            </span>
          </div>
        </header>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-m3-border bg-m3-card px-4 py-3">
            <p className="text-caption text-m3-secondary">Next up</p>
            <p className="mt-1 truncate text-sm font-semibold text-m3-text">{upcoming?.title ?? "Nothing scheduled"}</p>
          </div>
          <div className="rounded-lg border border-m3-border bg-m3-card px-4 py-3">
            <p className="text-caption text-m3-secondary">This week</p>
            <p className="mt-1 text-sm font-semibold text-m3-text">{eventCount} moments to prepare for</p>
          </div>
          <div className="rounded-lg border border-m3-border bg-m3-card px-4 py-3">
            <p className="text-caption text-m3-secondary">Team rhythm</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-m3-text"><Clock3 className="size-3.5 text-m3-primary" /> Shared planning space</p>
          </div>
        </div>

        <section className="min-h-[680px] overflow-hidden rounded-xl border border-m3-border bg-m3-card shadow-sm">
          <Calendar events={events} users={users} defaultView="month" onEventCreate={handleCreate} onEventUpdate={handleUpdate} />
        </section>
      </div>
    </div>
  );
}
