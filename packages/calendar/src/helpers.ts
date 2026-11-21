import {
  addDays,
  addMonths,
  addWeeks,
  subDays,
  subMonths,
  subWeeks,
  isSameWeek,
  isSameDay,
  isSameMonth,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  differenceInMinutes,
  eachDayOfInterval,
  startOfDay,
  endOfDay,
  differenceInDays,
  endOfYear,
  startOfYear,
  subYears,
  addYears,
  isSameYear,
  isWithinInterval,
} from "date-fns";

import type { ICalendarCell, AgendaEvent } from "./interfaces";
import type { TCalendarView, TVisibleHours, TWorkingHours, TEventColor } from "./types";

export function getEventStart(event: AgendaEvent): Date {
  if (event.startDate) return parseISO(event.startDate);
  const time = event.time || "00:00";
  const [h, m] = time.split(":").map(Number);
  const dateStr = event.date || format(new Date(), "yyyy-MM-dd");
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1, h || 0, m || 0, 0, 0);
}

export function getEventEnd(event: AgendaEvent): Date {
  if (event.endDate) return parseISO(event.endDate);
  const start = getEventStart(event);
  const duration = event.durationMinutes || 60;
  return new Date(start.getTime() + duration * 60 * 1000);
}

export function getEventColor(event: AgendaEvent): TEventColor {
  return (event.color as TEventColor) || "blue";
}

// ================ Header helper functions ================ //

export function rangeText(view: TCalendarView, date: Date) {
  const formatString = "MMM d, yyyy";
  let start: Date;
  let end: Date;

  switch (view) {
    case "agenda":
      start = startOfMonth(date);
      end = endOfMonth(date);
      break;
    case "year":
      start = startOfYear(date);
      end = endOfYear(date);
      break;
    case "month":
      start = startOfMonth(date);
      end = endOfMonth(date);
      break;
    case "week":
      start = startOfWeek(date);
      end = endOfWeek(date);
      break;
    case "day":
      return format(date, formatString);
    default:
      return "Error while formatting ";
  }

  return `${format(start, formatString)} - ${format(end, formatString)}`;
}

export function navigateDate(
  date: Date,
  view: TCalendarView,
  direction: "previous" | "next",
): Date {
  const operations = {
    agenda: direction === "next" ? addMonths : subMonths,
    year: direction === "next" ? addYears : subYears,
    month: direction === "next" ? addMonths : subMonths,
    week: direction === "next" ? addWeeks : subWeeks,
    day: direction === "next" ? addDays : subDays,
  };

  return operations[view](date, 1);
}

export function getEventsCount(events: AgendaEvent[], date: Date, view: TCalendarView): number {
  const compareFns = {
    agenda: isSameMonth,
    year: isSameYear,
    day: isSameDay,
    week: isSameWeek,
    month: isSameMonth,
  };

  return events.filter((event) => compareFns[view](getEventStart(event), date)).length;
}

// ================ Week and day view helper functions ================ //

export function getCurrentEvents(events: AgendaEvent[]) {
  const now = new Date();
  return events.filter((event) =>
    isWithinInterval(now, { start: getEventStart(event), end: getEventEnd(event) }),
  );
}

export function groupEvents(dayEvents: AgendaEvent[]) {
  const sortedEvents = [...dayEvents].sort(
    (a, b) => getEventStart(a).getTime() - getEventStart(b).getTime(),
  );
  const groups: AgendaEvent[][] = [];

  for (const event of sortedEvents) {
    const eventStart = getEventStart(event);

    let placed = false;
    for (const group of groups) {
      const lastEventInGroup = group[group.length - 1];
      const lastEventEnd = getEventEnd(lastEventInGroup);

      if (eventStart >= lastEventEnd) {
        group.push(event);
        placed = true;
        break;
      }
    }

    if (!placed) groups.push([event]);
  }

  return groups;
}

export function getEventBlockStyle(
  event: AgendaEvent,
  day: Date,
  groupIndex: number,
  groupSize: number,
  visibleHoursRange?: { from: number; to: number },
) {
  const startDate = getEventStart(event);
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const eventStart = startDate < dayStart ? dayStart : startDate;
  const startMinutes = differenceInMinutes(eventStart, dayStart);

  let top;

  if (visibleHoursRange) {
    const visibleStartMinutes = visibleHoursRange.from * 60;
    const visibleEndMinutes = visibleHoursRange.to * 60;
    const visibleRangeMinutes = Math.max(1, visibleEndMinutes - visibleStartMinutes);
    top = ((startMinutes - visibleStartMinutes) / visibleRangeMinutes) * 100;
  } else {
    top = (startMinutes / 1440) * 100;
  }

  const width = 100 / Math.max(1, groupSize);
  const left = groupIndex * width;

  return { top: `${Math.max(0, top)}%`, width: `${width}%`, left: `${left}%` };
}

export function isWorkingHour(day: Date, hour: number, workingHours?: TWorkingHours | null) {
  if (!workingHours) return true;
  const dayIndex = day.getDay() as keyof typeof workingHours;
  const dayHours = workingHours[dayIndex];
  if (!dayHours) return true;
  if (dayHours.from === 0 && dayHours.to === 0) return false;
  return hour >= dayHours.from && hour < dayHours.to;
}

export function getVisibleHours(visibleHours: TVisibleHours, singleDayEvents: AgendaEvent[]) {
  let earliestEventHour = visibleHours.from;
  let latestEventHour = visibleHours.to;

  singleDayEvents.forEach((event) => {
    const startHour = getEventStart(event).getHours();
    const endTime = getEventEnd(event);
    const endHour = endTime.getHours() + (endTime.getMinutes() > 0 ? 1 : 0);
    if (startHour < earliestEventHour) earliestEventHour = startHour;
    if (endHour > latestEventHour) latestEventHour = endHour;
  });

  earliestEventHour = Math.max(0, Math.min(earliestEventHour, 23));
  latestEventHour = Math.min(Math.max(latestEventHour, earliestEventHour + 1), 24);

  const hours = Array.from(
    { length: latestEventHour - earliestEventHour },
    (_, i) => i + earliestEventHour,
  );

  return { hours, earliestEventHour, latestEventHour };
}

// ================ Month view helper functions ================ //

export function getCalendarCells(selectedDate: Date): ICalendarCell[] {
  const currentYear = selectedDate.getFullYear();
  const currentMonth = selectedDate.getMonth();

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
  const daysInPrevMonth = getDaysInMonth(currentYear, currentMonth - 1);
  const totalDays = firstDayOfMonth + daysInMonth;

  const prevMonthCells = Array.from({ length: firstDayOfMonth }, (_, i) => ({
    day: daysInPrevMonth - firstDayOfMonth + i + 1,
    currentMonth: false,
    date: new Date(currentYear, currentMonth - 1, daysInPrevMonth - firstDayOfMonth + i + 1),
  }));

  const currentMonthCells = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    currentMonth: true,
    date: new Date(currentYear, currentMonth, i + 1),
  }));

  const nextMonthCells = Array.from({ length: (7 - (totalDays % 7)) % 7 }, (_, i) => ({
    day: i + 1,
    currentMonth: false,
    date: new Date(currentYear, currentMonth + 1, i + 1),
  }));

  return [...prevMonthCells, ...currentMonthCells, ...nextMonthCells];
}

export function calculateMonthEventPositions(
  multiDayEvents: AgendaEvent[],
  singleDayEvents: AgendaEvent[],
  selectedDate: Date,
) {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);

  const eventPositions: { [key: string]: number } = {};
  const occupiedPositions: { [key: string]: boolean[] } = {};

  eachDayOfInterval({ start: monthStart, end: monthEnd }).forEach((day) => {
    occupiedPositions[day.toISOString()] = [false, false, false];
  });

  const sortedEvents = [
    ...multiDayEvents.sort((a, b) => {
      const aDuration = differenceInDays(getEventEnd(a), getEventStart(a));
      const bDuration = differenceInDays(getEventEnd(b), getEventStart(b));
      return bDuration - aDuration || getEventStart(a).getTime() - getEventStart(b).getTime();
    }),
    ...singleDayEvents.sort((a, b) => getEventStart(a).getTime() - getEventStart(b).getTime()),
  ];

  sortedEvents.forEach((event) => {
    const eventStart = getEventStart(event);
    const eventEnd = getEventEnd(event);
    const eventDays = eachDayOfInterval({
      start: eventStart < monthStart ? monthStart : eventStart,
      end: eventEnd > monthEnd ? monthEnd : eventEnd,
    });

    let position = -1;

    for (let i = 0; i < 3; i++) {
      if (
        eventDays.every((day) => {
          const dayPositions = occupiedPositions[startOfDay(day).toISOString()];
          return dayPositions && !dayPositions[i];
        })
      ) {
        position = i;
        break;
      }
    }

    if (position !== -1) {
      eventDays.forEach((day) => {
        const dayKey = startOfDay(day).toISOString();
        if (occupiedPositions[dayKey]) {
          occupiedPositions[dayKey][position] = true;
        }
      });
      eventPositions[event.id] = position;
    }
  });

  return eventPositions;
}

export function getMonthCellEvents(
  date: Date,
  events: AgendaEvent[],
  eventPositions: Record<string, number>,
) {
  const cellStart = startOfDay(date);
  const cellEnd = endOfDay(date);

  const eventsForDate = events.filter((event) => {
    const eventStart = getEventStart(event);
    const eventEnd = getEventEnd(event);
    return (
      (date >= eventStart && date <= eventEnd) ||
      isSameDay(date, eventStart) ||
      isSameDay(date, eventEnd) ||
      (eventStart <= cellEnd && eventEnd >= cellStart)
    );
  });

  return eventsForDate
    .map((event) => ({
      ...event,
      position: eventPositions[event.id] ?? -1,
      isMultiDay: !isSameDay(getEventStart(event), getEventEnd(event)),
    }))
    .sort((a, b) => {
      if (a.isMultiDay && !b.isMultiDay) return -1;
      if (!a.isMultiDay && b.isMultiDay) return 1;
      return a.position - b.position;
    });
}
