// SPDX-License-Identifier: AGPL-3.0-only
import { useMemo } from "react";

import { useCalendar } from "../../contexts/calendar-context";

import { DayCell } from "./day-cell";

import { getCalendarCells, calculateMonthEventPositions } from "../../helpers";

import type { AgendaEvent } from "../../interfaces";

interface IProps {
  singleDayEvents: AgendaEvent[];
  multiDayEvents: AgendaEvent[];
  onDateClick?: (date: Date) => void;
}

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarMonthView({ singleDayEvents, multiDayEvents, onDateClick }: IProps) {
  const { selectedDate } = useCalendar();

  const allEvents = [...multiDayEvents, ...singleDayEvents];

  const cells = useMemo(() => getCalendarCells(selectedDate), [selectedDate]);

  const eventPositions = useMemo(
    () => calculateMonthEventPositions(multiDayEvents, singleDayEvents, selectedDate),
    [multiDayEvents, singleDayEvents, selectedDate],
  );

  return (
    <div>
      <div className="grid grid-cols-7 divide-x divide-m3-border">
        {WEEK_DAYS.map((day) => (
          <div key={day} className="flex items-center justify-center py-2">
            <span className="text-xs font-medium text-m3-secondary">{day}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 overflow-hidden">
        {cells.map((cell) => (
          <DayCell
            key={cell.date.toISOString()}
            cell={cell}
            events={allEvents}
            eventPositions={eventPositions}
            onDateClick={onDateClick}
          />
        ))}
      </div>
    </div>
  );
}
