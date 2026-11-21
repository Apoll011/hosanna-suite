"use client";

import { useMemo } from "react";
import { isSameDay } from "date-fns";

import { CalendarProvider, useCalendar } from "../contexts/calendar-context";
import { DndProviderWrapper } from "./dnd/dnd-provider";
import { CalendarHeader } from "./header/calendar-header";
import { CalendarYearView } from "./year-view/calendar-year-view";
import { CalendarMonthView } from "./month-view/calendar-month-view";
import { CalendarAgendaView } from "./agenda-view/calendar-agenda-view";
import { CalendarDayView } from "./week-and-day-view/calendar-day-view";
import { CalendarWeekView } from "./week-and-day-view/calendar-week-view";
import { getEventStart, getEventEnd } from "../helpers";

import type { AgendaEvent, IUser, ResponsibilityCategory, Service } from "../interfaces";
import type { TCalendarView, TVisibleHours, TWorkingHours } from "../types";

export interface CalendarProps {
  events?: AgendaEvent[];
  users?: IUser[];
  categories?: ResponsibilityCategory[];
  services?: Service[];
  workingHours?: TWorkingHours | null;
  visibleHours?: TVisibleHours;
  view?: TCalendarView;
  defaultView?: TCalendarView;
  initialDate?: Date;
  initialEventId?: string | null;
  onViewChange?: (view: TCalendarView) => void;
  onDateChange?: (date: Date) => void;
  onEventCreate?: (event: AgendaEvent) => void;
  onEventUpdate?: (event: AgendaEvent) => void;
  onEventDelete?: (event: AgendaEvent) => void;
  onEventSelect?: (event: AgendaEvent | null) => void;
  onAddResponsibility?: (eventId: string) => void;
  onEditAssignees?: (eventId: string, respId: string) => void;
  onRemoveResponsibility?: (eventId: string, respId: string) => void;
  onPrintEvent?: (event: AgendaEvent) => void;
  onOpenService?: (serviceId: string) => void;
  onRequestCreateEvent?: (initial?: { date?: string; time?: string }) => void;
  onRequestEditEvent?: (event: AgendaEvent) => void;
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
  className?: string;
}

export function Calendar({
  events = [],
  users = [],
  categories = [],
  services = [],
  workingHours = null,
  visibleHours,
  view,
  defaultView = "month",
  initialDate,
  initialEventId,
  onViewChange,
  onDateChange,
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  onEventSelect,
  onAddResponsibility,
  onEditAssignees,
  onRemoveResponsibility,
  onPrintEvent,
  onOpenService,
  onRequestCreateEvent,
  onRequestEditEvent,
  canCreate = true,
  canUpdate = true,
  canDelete = true,
  className,
}: CalendarProps) {
  return (
    <CalendarProvider
      users={users}
      events={events}
      categories={categories}
      services={services}
      workingHours={workingHours}
      visibleHours={visibleHours}
      initialDate={initialDate}
      initialEventId={initialEventId}
      view={view}
      onViewChange={onViewChange}
      onDateChange={onDateChange}
      onEventCreate={onEventCreate}
      onEventUpdate={onEventUpdate}
      onEventDelete={onEventDelete}
      onEventSelect={onEventSelect}
      onAddResponsibility={onAddResponsibility}
      onEditAssignees={onEditAssignees}
      onRemoveResponsibility={onRemoveResponsibility}
      onPrintEvent={onPrintEvent}
      onOpenService={onOpenService}
      onRequestCreateEvent={onRequestCreateEvent}
      onRequestEditEvent={onRequestEditEvent}
      canCreate={canCreate}
      canUpdate={canUpdate}
      canDelete={canDelete}
    >
      <CalendarContent className={className} defaultView={defaultView} />
    </CalendarProvider>
  );
}

function CalendarContent({ className }: { className?: string; defaultView?: TCalendarView }) {
  const { view, setView, selectedDate, selectedUserId, events, setSelectedDate } = useCalendar();

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const start = getEventStart(event);
      const end = getEventEnd(event);
      const userMatch =
        selectedUserId === "all" ||
        event.user?.id === selectedUserId ||
        (event.responsibilities &&
          event.responsibilities.some(r =>
            r.assignees.some(a => a.memberId === selectedUserId || a.name.toLowerCase() === selectedUserId.toLowerCase())
          ));
      if (!userMatch) return false;

      if (view === "year") {
        return (
          start <= new Date(selectedDate.getFullYear(), 11, 31, 23, 59, 59) &&
          end >= new Date(selectedDate.getFullYear(), 0, 1)
        );
      }
      if (view === "month" || view === "agenda") {
        return (
          start <= new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59) &&
          end >= new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
        );
      }
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

  const singleDayEvents = filteredEvents.filter(event => isSameDay(getEventStart(event), getEventEnd(event)));
  const multiDayEvents = filteredEvents.filter(event => !isSameDay(getEventStart(event), getEventEnd(event)));
  const eventStartDates = filteredEvents.map(event => ({ ...event, endDate: event.startDate }));

  return (
    <div className={className ?? "overflow-hidden rounded-lg border border-m3-border bg-m3-card w-full"}>
      <CalendarHeader view={view} events={filteredEvents} onViewChange={setView} />
      <DndProviderWrapper>
        {view === "day" && <CalendarDayView singleDayEvents={singleDayEvents} multiDayEvents={multiDayEvents} />}
        {view === "month" && (
          <CalendarMonthView
            singleDayEvents={singleDayEvents}
            multiDayEvents={multiDayEvents}
            onDateClick={date => {
              setSelectedDate(date);
              setView("day");
            }}
          />
        )}
        {view === "week" && <CalendarWeekView singleDayEvents={singleDayEvents} multiDayEvents={multiDayEvents} />}
        {view === "year" && (
          <CalendarYearView
            allEvents={eventStartDates}
            onDateClick={date => {
              setSelectedDate(date);
              setView("day");
            }}
            onMonthClick={date => {
              setSelectedDate(date);
              setView("month");
            }}
          />
        )}
        {view === "agenda" && <CalendarAgendaView singleDayEvents={singleDayEvents} multiDayEvents={multiDayEvents} />}
      </DndProviderWrapper>
    </div>
  );
}
