import { useMemo } from "react";
import { isToday, startOfDay } from "date-fns";

import { useCalendar } from "../../contexts/calendar-context";

import { EventBullet } from "./event-bullet";
import { DroppableDayCell } from "../dnd/droppable-day-cell";
import { MonthEventBadge } from "./month-event-badge";

import { cn } from "../../lib/cn";
import { getMonthCellEvents } from "../../helpers";

import type { ICalendarCell, IEvent } from "../../interfaces";

interface IProps {
  cell: ICalendarCell;
  events: IEvent[];
  eventPositions: Record<string, number>;
  onDateClick?: (date: Date) => void;
}

const MAX_VISIBLE_EVENTS = 3;

export function DayCell({ cell, events, eventPositions, onDateClick }: IProps) {
  const { setSelectedDate } = useCalendar();

  const { day, currentMonth, date } = cell;

  const cellEvents = useMemo(() => getMonthCellEvents(date, events, eventPositions), [date, events, eventPositions]);
  const isSunday = date.getDay() === 0;

  const handleClick = () => {
    setSelectedDate(date);
    onDateClick?.(date);
  };

  return (
    <DroppableDayCell cell={cell}>
      <div className={cn("flex h-full flex-col gap-1 border-t border-m3-border py-1.5 lg:pb-2 lg:pt-1", isSunday && "border-l-0")}>
        <button
          onClick={handleClick}
          className={cn(
            "flex size-6 translate-x-1 items-center justify-center rounded-full text-xs font-semibold hover:bg-m3-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-m3-primary lg:px-2",
            !currentMonth && "opacity-20",
            isToday(date) && "bg-m3-primary font-bold text-white hover:bg-m3-primary"
          )}
        >
          {day}
        </button>

        <div className={cn("flex h-6 gap-1 px-2 lg:h-[94px] lg:flex-col lg:gap-2 lg:px-0", !currentMonth && "opacity-50")}>
          {[0, 1, 2].map(position => {
            const event = cellEvents.find(e => e.position === position);
            const eventKey = event ? `event-${event.id}-${position}` : `empty-${position}`;

            return (
              <div key={eventKey} className="lg:flex-1">
                {event && (
                  <>
                    <EventBullet className="lg:hidden" color={event.color} />
                    <MonthEventBadge className="hidden lg:flex" event={event} cellDate={startOfDay(date)} />
                  </>
                )}
              </div>
            );
          })}
        </div>

        {cellEvents.length > MAX_VISIBLE_EVENTS && (
          <p className={cn("h-4.5 px-1.5 text-xs font-semibold text-m3-secondary", !currentMonth && "opacity-50")}>
            <span className="sm:hidden">+{cellEvents.length - MAX_VISIBLE_EVENTS}</span>
            <span className="hidden sm:inline"> {cellEvents.length - MAX_VISIBLE_EVENTS} more...</span>
          </p>
        )}
      </div>
    </DroppableDayCell>
  );
}
