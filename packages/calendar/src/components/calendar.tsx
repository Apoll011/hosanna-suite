"use client";

import { useMemo, useState } from "react";

import { CalendarProvider, useCalendar } from "../contexts/calendar-context";
import { DndProviderWrapper } from "./dnd/dnd-provider";
import { CalendarHeader } from "./header/calendar-header";
import { CalendarYearView } from "./year-view/calendar-year-view";
import { CalendarMonthView } from "./month-view/calendar-month-view";
import { CalendarAgendaView } from "./agenda-view/calendar-agenda-view";
import { CalendarDayView } from "./week-and-day-view/calendar-day-view";
import { CalendarWeekView } from "./week-and-day-view/calendar-week-view";

import type { IAgendaEvent } from "../interfaces";
import type { TCalendarView } from "../types";

export interface CalendarProps {
  events?: IAgendaEvent[];
  view?: TCalendarView;
  defaultView?: TCalendarView;
  initialDate?: Date;
  onViewChange?: (view: TCalendarView) => void;
  onDateChange?: (date: Date) => void;
  onEventCreate?: (event: IAgendaEvent) => void;
  onEventUpdate?: (event: IAgendaEvent, patch: Partial<IAgendaEvent>) => void;
  onEventClick?: (event: IAgendaEvent) => void;
  className?: string;
}

export function Calendar({
  events = [],
  view: controlledView,
  defaultView = "month",
  initialDate,
  onViewChange,
  onDateChange,
  onEventCreate,
  onEventUpdate,
  onEventClick,
  className,
}: CalendarProps) {
  const [uncontrolledView, setUncontrolledView] = useState(defaultView);
  const view = controlledView ?? uncontrolledView;
  const handleViewChange = (nextView: TCalendarView) => {
    if (controlledView === undefined) setUncontrolledView(nextView);
    onViewChange?.(nextView);
  };

  return (
    <CalendarProvider events={events} initialDate={initialDate} onDateChange={onDateChange} onEventCreate={onEventCreate} onEventUpdate={onEventUpdate} onEventClick={onEventClick}>
      <CalendarContent view={view} onViewChange={handleViewChange} className={className} />
    </CalendarProvider>
  );
}

function CalendarContent({ view, onViewChange, className }: { view: TCalendarView; onViewChange: (view: TCalendarView) => void; className?: string }) {
  const { selectedDate, events, setSelectedDate } = useCalendar();
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const [hour = 0, minute = 0] = event.time.split(":").map(Number);
      const start = new Date(`${event.date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`);
      const end = new Date(start.getTime() + event.durationMinutes * 60_000);
      if (view === "year") return start <= new Date(selectedDate.getFullYear(), 11, 31, 23, 59, 59) && end >= new Date(selectedDate.getFullYear(), 0, 1);
      if (view === "month" || view === "agenda") return start <= new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59) && end >= new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      if (view === "week") {
        const weekStart = new Date(selectedDate);
        weekStart.setDate(selectedDate.getDate() - selectedDate.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        return start <= weekEnd && end >= weekStart;
      }
      const dayStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      const dayEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 23, 59, 59);
      return start <= dayEnd && end >= dayStart;
    });
  }, [events, selectedDate, view]);
  const singleDayEvents = filteredEvents;
  const multiDayEvents: typeof filteredEvents = [];
  const eventStartDates = filteredEvents;

  return (
    <div className={className ?? "overflow-hidden rounded-lg border border-m3-border"}>
      <CalendarHeader view={view} events={filteredEvents} onViewChange={onViewChange} />
      <DndProviderWrapper>
        {view === "day" && <CalendarDayView singleDayEvents={singleDayEvents} multiDayEvents={multiDayEvents} />}
        {view === "month" && <CalendarMonthView singleDayEvents={singleDayEvents} multiDayEvents={multiDayEvents} onDateClick={date => { setSelectedDate(date); onViewChange("day"); }} />}
        {view === "week" && <CalendarWeekView singleDayEvents={singleDayEvents} multiDayEvents={multiDayEvents} />}
        {view === "year" && <CalendarYearView allEvents={eventStartDates} onDateClick={date => { setSelectedDate(date); onViewChange("day"); }} onMonthClick={date => { setSelectedDate(date); onViewChange("month"); }} />}
        {view === "agenda" && <CalendarAgendaView singleDayEvents={singleDayEvents} multiDayEvents={multiDayEvents} />}
      </DndProviderWrapper>
    </div>
  );
}
