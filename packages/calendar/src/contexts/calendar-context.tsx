"use client";

import { createContext, useContext, useState } from "react";

import type { Dispatch, SetStateAction } from "react";
import type { IAgendaEvent } from "../interfaces";
import type { TBadgeVariant, TVisibleHours, TWorkingHours } from "../types";

export interface CalendarProviderProps {
  children: React.ReactNode;
  events?: IAgendaEvent[];
  initialDate?: Date;
  onDateChange?: (date: Date) => void;
  onEventCreate?: (event: IAgendaEvent) => void;
  onEventUpdate?: (event: IAgendaEvent, patch: Partial<IAgendaEvent>) => void;
  onEventClick?: (event: IAgendaEvent) => void;
}

interface ICalendarContext {
  selectedDate: Date;
  setSelectedDate: (date: Date | undefined) => void;
  badgeVariant: TBadgeVariant;
  setBadgeVariant: (variant: TBadgeVariant) => void;
  workingHours: TWorkingHours;
  setWorkingHours: Dispatch<SetStateAction<TWorkingHours>>;
  visibleHours: TVisibleHours;
  setVisibleHours: Dispatch<SetStateAction<TVisibleHours>>;
  events: IAgendaEvent[];
  setLocalEvents: Dispatch<SetStateAction<IAgendaEvent[]>>;
  createEvent: (event: IAgendaEvent) => void;
  updateEvent: (event: IAgendaEvent, patch: Partial<IAgendaEvent>) => void;
  clickEvent?: (event: IAgendaEvent) => void;
}

const CalendarContext = createContext({} as ICalendarContext);

const WORKING_HOURS = {
  0: { from: 0, to: 0 },
  1: { from: 8, to: 17 },
  2: { from: 8, to: 17 },
  3: { from: 8, to: 17 },
  4: { from: 8, to: 17 },
  5: { from: 8, to: 17 },
  6: { from: 8, to: 12 },
};

const VISIBLE_HOURS = { from: 7, to: 18 };

export function CalendarProvider({ children, events = [], initialDate, onDateChange, onEventCreate, onEventUpdate, onEventClick }: CalendarProviderProps) {
  const [badgeVariant, setBadgeVariant] = useState<TBadgeVariant>("colored");
  const [visibleHours, setVisibleHours] = useState<TVisibleHours>(VISIBLE_HOURS);
  const [workingHours, setWorkingHours] = useState<TWorkingHours>(WORKING_HOURS);

  const [selectedDate, setSelectedDate] = useState(initialDate ?? new Date());
  // This localEvents doesn't need to exists in a real scenario.
  // It's used here just to simulate the update of the events.
  // In a real scenario, the events would be updated in the backend
  // and the request that fetches the events should be refetched
  const [localEvents, setLocalEvents] = useState<IAgendaEvent[]>(events);

  const createEvent = (event: IAgendaEvent) => {
    setLocalEvents(previous => [...previous, event]);
    onEventCreate?.(event);
  };

  const updateEvent = (event: IAgendaEvent, patch: Partial<IAgendaEvent>) => {
    setLocalEvents(previous => previous.map(current => (current.id === event.id ? { ...current, ...patch } : current)));
    onEventUpdate?.(event, patch);
  };

  const handleSelectDate = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    onDateChange?.(date);
  };

  return (
    <CalendarContext.Provider
      value={{
        selectedDate,
        setSelectedDate: handleSelectDate,
        badgeVariant,
        setBadgeVariant,
        visibleHours,
        setVisibleHours,
        workingHours,
        setWorkingHours,
        // If you go to the refetch approach, you can remove the localEvents and pass the events directly
        events: localEvents,
        setLocalEvents,
        createEvent,
        updateEvent,
        clickEvent: onEventClick,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar(): ICalendarContext {
  const context = useContext(CalendarContext);
  if (!context) throw new Error("useCalendar must be used within a CalendarProvider.");
  return context;
}
