"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { getEventStart } from "../helpers";

import type { Dispatch, SetStateAction } from "react";
import type { AgendaEvent, IUser, ResponsibilityCategory, Service } from "../interfaces";
import type { TBadgeVariant, TCalendarView, TVisibleHours, TWorkingHours } from "../types";

export interface CalendarProviderProps {
  children: React.ReactNode;
  users?: IUser[];
  events?: AgendaEvent[];
  categories?: ResponsibilityCategory[];
  services?: Service[];
  workingHours?: TWorkingHours | null;
  visibleHours?: TVisibleHours;
  initialDate?: Date;
  initialEventId?: string | null;
  view?: TCalendarView;
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
}

interface ICalendarContext {
  view: TCalendarView;
  setView: (view: TCalendarView) => void;
  selectedDate: Date;
  setSelectedDate: (date: Date | undefined) => void;
  selectedUserId: IUser["id"] | "all";
  setSelectedUserId: (userId: IUser["id"] | "all") => void;
  selectedEventId: string | null;
  setSelectedEventId: (id: string | null) => void;
  selectedEvent: AgendaEvent | null;
  selectEvent: (event: AgendaEvent | null) => void;
  badgeVariant: TBadgeVariant;
  setBadgeVariant: (variant: TBadgeVariant) => void;
  users: IUser[];
  categories: ResponsibilityCategory[];
  services: Service[];
  workingHours?: TWorkingHours | null;
  setWorkingHours: Dispatch<SetStateAction<TWorkingHours | null | undefined>>;
  visibleHours: TVisibleHours;
  setVisibleHours: Dispatch<SetStateAction<TVisibleHours>>;
  events: AgendaEvent[];
  setLocalEvents: Dispatch<SetStateAction<AgendaEvent[]>>;
  createEvent: (event: AgendaEvent) => void;
  updateEvent: (event: AgendaEvent) => void;
  deleteEvent?: (event: AgendaEvent) => void;
  addResponsibility?: (eventId: string) => void;
  editAssignees?: (eventId: string, respId: string) => void;
  removeResponsibility?: (eventId: string, respId: string) => void;
  printEvent?: (event: AgendaEvent) => void;
  onOpenService?: (serviceId: string) => void;
  onRequestCreateEvent?: (initial?: { date?: string; time?: string }) => void;
  onRequestEditEvent?: (event: AgendaEvent) => void;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

const CalendarContext = createContext({} as ICalendarContext);

const DEFAULT_VISIBLE_HOURS: TVisibleHours = { from: 7, to: 22 };

export function CalendarProvider({
  children,
  users = [],
  events = [],
  categories = [],
  services = [],
  workingHours: initialWorkingHours = null,
  visibleHours: initialVisibleHours = DEFAULT_VISIBLE_HOURS,
  initialDate,
  initialEventId = null,
  view: controlledView,
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
}: CalendarProviderProps) {
  const [badgeVariant, setBadgeVariant] = useState<TBadgeVariant>("colored");
  const [visibleHours, setVisibleHours] = useState<TVisibleHours>(initialVisibleHours);
  const [workingHours, setWorkingHours] = useState<TWorkingHours | null | undefined>(initialWorkingHours);

  const [uncontrolledView, setUncontrolledView] = useState<TCalendarView>("month");
  const view = controlledView ?? uncontrolledView;
  const setView = (nextView: TCalendarView) => {
    if (controlledView === undefined) setUncontrolledView(nextView);
    onViewChange?.(nextView);
  };

  const [selectedDate, setSelectedDateState] = useState(initialDate ?? new Date());
  const [selectedUserId, setSelectedUserId] = useState<IUser["id"] | "all">("all");
  const [selectedEventId, setSelectedEventIdState] = useState<string | null>(initialEventId);
  const [localEvents, setLocalEvents] = useState<AgendaEvent[]>(events);

  const allEvents = events.length > 0 ? events : localEvents;

  const selectedEvent = useMemo(() => {
    if (!selectedEventId) return null;
    return allEvents.find(e => e.id === selectedEventId) ?? null;
  }, [allEvents, selectedEventId]);

  const setSelectedDate = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDateState(date);
    onDateChange?.(date);
  };

  const setSelectedEventId = (id: string | null) => {
    setSelectedEventIdState(id);
    const found = id ? allEvents.find(e => e.id === id) ?? null : null;
    onEventSelect?.(found);
  };

  const selectEvent = (event: AgendaEvent | null) => {
    if (!event) {
      setSelectedEventId(null);
      return;
    }
    const eventDate = getEventStart(event);
    setSelectedDate(eventDate);
    setSelectedEventId(event.id);
    setView("day");
  };

  const createEvent = (event: AgendaEvent) => {
    onEventCreate?.(event);
    setLocalEvents(prev => [...prev, event]);
  };

  const updateEvent = (event: AgendaEvent) => {
    onEventUpdate?.(event);
    setLocalEvents(prev => prev.map(current => (current.id === event.id ? event : current)));
  };

  const deleteEvent = (event: AgendaEvent) => {
    onEventDelete?.(event);
    setLocalEvents(prev => prev.filter(current => current.id !== event.id));
    if (selectedEventId === event.id) {
      setSelectedEventId(null);
    }
  };

  return (
    <CalendarContext.Provider
      value={{
        view,
        setView,
        selectedDate,
        setSelectedDate,
        selectedUserId,
        setSelectedUserId,
        selectedEventId,
        setSelectedEventId,
        selectedEvent,
        selectEvent,
        badgeVariant,
        setBadgeVariant,
        users,
        categories,
        services,
        workingHours,
        setWorkingHours,
        visibleHours,
        setVisibleHours,
        events: allEvents,
        setLocalEvents,
        createEvent,
        updateEvent,
        deleteEvent: onEventDelete ? deleteEvent : undefined,
        addResponsibility: onAddResponsibility,
        editAssignees: onEditAssignees,
        removeResponsibility: onRemoveResponsibility,
        printEvent: onPrintEvent,
        onOpenService,
        onRequestCreateEvent,
        onRequestEditEvent,
        canCreate,
        canUpdate,
        canDelete,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar() {
  const context = useContext(CalendarContext);
  if (!context) throw new Error("useCalendar must be used within a CalendarProvider");
  return context;
}
