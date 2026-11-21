"use client";

import { useMemo, useState } from "react";
import { isSameDay, parseISO } from "date-fns";

import { CalendarProvider, useCalendar } from "../contexts/calendar-context";
import { DndProviderWrapper } from "./dnd/dnd-provider";
import { CalendarHeader } from "./header/calendar-header";
import { CalendarYearView } from "./year-view/calendar-year-view";
import { CalendarMonthView } from "./month-view/calendar-month-view";
import { CalendarAgendaView } from "./agenda-view/calendar-agenda-view";
import { CalendarDayView } from "./week-and-day-view/calendar-day-view";
import { CalendarWeekView } from "./week-and-day-view/calendar-week-view";

import type { IEvent, IUser } from "../interfaces";
import type { TCalendarView } from "../types";

export interface CalendarProps {
  events?: IEvent[];
  users?: IUser[];
  view?: TCalendarView;
  defaultView?: TCalendarView;
  initialDate?: Date;
  onViewChange?: (view: TCalendarView) => void;
  onDateChange?: (date: Date) => void;
  onEventCreate?: (event: IEvent) => void;
  onEventUpdate?: (event: IEvent) => void;
  className?: string;
}

export function Calendar({
  events = [],
  users = [],
  view: controlledView,
  defaultView = "month",
  initialDate,
  onViewChange,
  onDateChange,
  onEventCreate,
  onEventUpdate,
  className,
}: CalendarProps) {
  const [uncontrolledView, setUncontrolledView] = useState(defaultView);
  const view = controlledView ?? uncontrolledView;
  const handleViewChange = (nextView: TCalendarView) => {
    if (controlledView === undefined) setUncontrolledView(nextView);
    onViewChange?.(nextView);
  };

  return (
    <CalendarProvider users={users} events={events} initialDate={initialDate} onDateChange={onDateChange} onEventCreate={onEventCreate} onEventUpdate={onEventUpdate}>
      <CalendarContent view={view} onViewChange={handleViewChange} className={className} />
    </CalendarProvider>
  );
}

function CalendarContent({ view, onViewChange, className }: { view: TCalendarView; onViewChange: (view: TCalendarView) => void; className?: string }) {
  const { selectedDate, selectedUserId, events, setSelectedDate } = useCalendar();
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const start = parseISO(event.startDate);
      const end = parseISO(event.endDate);
      const userMatch = selectedUserId === "all" || event.user.id === selectedUserId;
      if (!userMatch) return false;
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
  }, [events, selectedDate, selectedUserId, view]);
  const singleDayEvents = filteredEvents.filter(event => isSameDay(parseISO(event.startDate), parseISO(event.endDate)));
  const multiDayEvents = filteredEvents.filter(event => !isSameDay(parseISO(event.startDate), parseISO(event.endDate)));
  const eventStartDates = filteredEvents.map(event => ({ ...event, endDate: event.startDate }));

  return (
    <div className={className ?? "overflow-hidden rounded-lg border border-m3-border bg-m3-card"}>
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
