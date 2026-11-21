import { useMemo } from "react";
import { format, isSameDay, parseISO, getDaysInMonth, startOfMonth } from "date-fns";

import { useCalendar } from "../../contexts/calendar-context";

import { YearViewDayCell } from "./year-view-day-cell";

import type { IEvent } from "../../interfaces";

interface IProps {
  month: Date;
  events: IEvent[];
  onDateClick?: (date: Date) => void;
  onMonthClick?: (date: Date) => void;
}

export function YearViewMonth({ month, events, onDateClick, onMonthClick }: IProps) {
  const { setSelectedDate } = useCalendar();

  const monthName = format(month, "MMMM");

  const daysInMonth = useMemo(() => {
    const totalDays = getDaysInMonth(month);
    const firstDay = startOfMonth(month).getDay();

    const days = Array.from({ length: totalDays }, (_, i) => i + 1);
    const blanks = Array(firstDay).fill(null);

    return [...blanks, ...days];
  }, [month]);

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handleClick = () => {
    setSelectedDate(new Date(month.getFullYear(), month.getMonth(), 1));
    onMonthClick?.(new Date(month.getFullYear(), month.getMonth(), 1));
  };

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={handleClick}
        className="w-full border-b border-m3-border px-3 py-2 text-sm font-semibold hover:bg-m3-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-m3-primary"
      >
        {monthName}
      </button>

      <div className="flex-1 space-y-2 p-3">
        <div className="grid grid-cols-7 gap-x-0.5 text-center">
          {weekDays.map((day, index) => (
            <div key={index} className="text-xs font-medium text-m3-secondary">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-x-0.5 gap-y-2">
          {daysInMonth.map((day, index) => {
            if (day === null) return <div key={`blank-${index}`} className="h-10" />;

            const date = new Date(month.getFullYear(), month.getMonth(), day);
            const dayEvents = events.filter(event => isSameDay(parseISO(event.startDate), date) || isSameDay(parseISO(event.endDate), date));

            return <YearViewDayCell key={`day-${day}`} day={day} date={date} events={dayEvents} onDateClick={onDateClick} />;
          })}
        </div>
      </div>
    </div>
  );
}
