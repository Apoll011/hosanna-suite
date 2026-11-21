import { isToday } from "date-fns";

import { useCalendar } from "../../contexts/calendar-context";
import { getEventColor } from "../../helpers";

import { cn } from "../../lib/cn";

import type { IEvent } from "../../interfaces";

interface IProps {
  day: number;
  date: Date;
  events: IEvent[];
  onDateClick?: (date: Date) => void;
}

export function YearViewDayCell({ day, date, events, onDateClick }: IProps) {
  const { setSelectedDate } = useCalendar();

  const maxIndicators = 3;
  const eventCount = events.length;

  const handleClick = () => {
    setSelectedDate(date);
    onDateClick?.(date);
  };

  return (
    <button
      onClick={handleClick}
      type="button"
      className="flex h-11 flex-1 flex-col items-center justify-start gap-0.5 rounded-md pt-1 hover:bg-m3-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-m3-primary"
    >
      <div
        className={cn(
          "flex size-6 items-center justify-center rounded-full text-xs font-medium",
          isToday(date) && "bg-m3-primary font-semibold text-white",
        )}
      >
        {day}
      </div>

      {eventCount > 0 && (
        <div className="mt-0.5 flex gap-0.5">
          {eventCount <= maxIndicators ? (
            events.map((event) => {
              const eventColor = getEventColor(event);
              return (
                <div
                  key={event.id}
                  className={cn(
                    "size-1.5 rounded-full",
                    eventColor === "blue" && "bg-blue-600",
                    eventColor === "green" && "bg-green-600",
                    eventColor === "red" && "bg-red-600",
                    eventColor === "yellow" && "bg-yellow-600",
                    eventColor === "purple" && "bg-purple-600",
                    eventColor === "orange" && "bg-orange-600",
                    eventColor === "gray" && "bg-neutral-600",
                  )}
                />
              );
            })
          ) : (
            <>
              <div
                className={cn(
                  "size-1.5 rounded-full",
                  getEventColor(events[0]) === "blue" && "bg-blue-600",
                  getEventColor(events[0]) === "green" && "bg-green-600",
                  getEventColor(events[0]) === "red" && "bg-red-600",
                  getEventColor(events[0]) === "yellow" && "bg-yellow-600",
                  getEventColor(events[0]) === "purple" && "bg-purple-600",
                  getEventColor(events[0]) === "orange" && "bg-orange-600",
                  getEventColor(events[0]) === "gray" && "bg-neutral-600",
                )}
              />
              <span className="text-[7px] text-m3-secondary">+{eventCount - 1}</span>
            </>
          )}
        </div>
      )}
    </button>
  );
}
