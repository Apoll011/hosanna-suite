import { Columns, Grid3x3, List, Plus, Grid2x2, CalendarRange } from "lucide-react";

import { Button } from "../../ui/button";

import { UserSelect } from "./user-select";
import { TodayButton } from "./today-button";
import { DateNavigator } from "./date-navigator";
import { AddEventDialog } from "../dialogs/add-event-dialog";
import { useCalendar } from "../../contexts/calendar-context";

import type { AgendaEvent } from "../../interfaces";
import type { TCalendarView } from "../../types";

interface IProps {
  view: TCalendarView;
  events: AgendaEvent[];
  onViewChange?: (view: TCalendarView) => void;
}

export function CalendarHeader({ view, events, onViewChange }: IProps) {
  const { canCreate } = useCalendar();

  return (
    <div className="flex flex-col gap-3 border-b border-m3-border px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-3">
        <TodayButton />
        <DateNavigator view={view} events={events} />
      </div>

      <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:justify-between">
        <div className="flex w-full items-center gap-1.5">
          <div className="inline-flex items-center gap-1 rounded-lg bg-m3-sidebar p-1">
            <Button
              asChild
              aria-label="View by day"
              size="icon"
              variant={view === "day" ? "default" : "outline"}
              className="rounded-md [&_svg]:size-5"
            >
              <button type="button" onClick={() => onViewChange?.("day")}>
                <List strokeWidth={1.8} />
              </button>
            </Button>

            <Button
              asChild
              aria-label="View by week"
              size="icon"
              variant={view === "week" ? "default" : "outline"}
              className="rounded-md [&_svg]:size-5"
            >
              <button type="button" onClick={() => onViewChange?.("week")}>
                <Columns strokeWidth={1.8} />
              </button>
            </Button>

            <Button
              asChild
              aria-label="View by month"
              size="icon"
              variant={view === "month" ? "default" : "outline"}
              className="rounded-md [&_svg]:size-5"
            >
              <button type="button" onClick={() => onViewChange?.("month")}>
                <Grid2x2 strokeWidth={1.8} />
              </button>
            </Button>

            <Button
              asChild
              aria-label="View by year"
              size="icon"
              variant={view === "year" ? "default" : "outline"}
              className="rounded-md [&_svg]:size-5"
            >
              <button type="button" onClick={() => onViewChange?.("year")}>
                <Grid3x3 strokeWidth={1.8} />
              </button>
            </Button>

            <Button
              asChild
              aria-label="View by agenda"
              size="icon"
              variant={view === "agenda" ? "default" : "outline"}
              className="-ml-px rounded-md [&_svg]:size-5"
            >
              <button type="button" onClick={() => onViewChange?.("agenda")}>
                <CalendarRange strokeWidth={1.8} />
              </button>
            </Button>
          </div>

          <UserSelect />
        </div>

        {canCreate && (
          <AddEventDialog>
            <Button className="w-full sm:w-auto">
              <Plus />
              Add Event
            </Button>
          </AddEventDialog>
        )}
      </div>
    </div>
  );
}
