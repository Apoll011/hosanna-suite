// SPDX-License-Identifier: AGPL-3.0-only
import { useMemo } from "react";
import { startOfWeek, endOfWeek, differenceInDays, isBefore, isAfter } from "date-fns";

import { MonthEventBadge } from "../month-view/month-event-badge";
import { getEventStart, getEventEnd } from "../../helpers";

import type { AgendaEvent } from "../../interfaces";

interface IProps {
  selectedDate: Date;
  multiDayEvents: AgendaEvent[];
}

export function WeekViewMultiDayEventsRow({ selectedDate, multiDayEvents }: IProps) {
  const weekStart = startOfWeek(selectedDate);
  const weekEnd = endOfWeek(selectedDate);

  const processedEvents = useMemo(() => {
    return multiDayEvents
      .map((event) => {
        const start = getEventStart(event);
        const end = getEventEnd(event);
        const adjustedStart = isBefore(start, weekStart) ? weekStart : start;
        const adjustedEnd = isAfter(end, weekEnd) ? weekEnd : end;
        const startIndex = differenceInDays(adjustedStart, weekStart);
        const endIndex = differenceInDays(adjustedEnd, weekStart);

        return {
          ...event,
          adjustedStart,
          adjustedEnd,
          startIndex,
          endIndex,
        };
      })
      .sort((a, b) => {
        const startDiff = a.adjustedStart.getTime() - b.adjustedStart.getTime();
        if (startDiff !== 0) return startDiff;
        return b.endIndex - b.startIndex - (a.endIndex - a.startIndex);
      });
  }, [multiDayEvents, weekStart, weekEnd]);

  const eventRows = useMemo(() => {
    const rows: (typeof processedEvents)[] = [];

    processedEvents.forEach((event) => {
      let rowIndex = rows.findIndex((row) =>
        row.every((e) => e.endIndex < event.startIndex || e.startIndex > event.endIndex),
      );

      if (rowIndex === -1) {
        rowIndex = rows.length;
        rows.push([]);
      }

      rows[rowIndex].push(event);
    });

    return rows;
  }, [processedEvents]);

  const hasEventsInWeek = useMemo(() => {
    return processedEvents.some((event) => event.startIndex < 7 && event.endIndex >= 0);
  }, [processedEvents]);

  if (!hasEventsInWeek) return null;

  return (
    <div className="flex border-b">
      <div className="w-18"></div>
      <div className="flex flex-1 flex-col gap-1 border-l py-1">
        {eventRows.map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-7 gap-1">
            {row.map((event) => {
              const span = event.endIndex - event.startIndex + 1;
              const colStart = event.startIndex + 1;

              return (
                <div
                  key={event.id}
                  style={{
                    gridColumnStart: colStart,
                    gridColumnEnd: `span ${Math.min(span, 8 - colStart)}`,
                  }}
                >
                  <MonthEventBadge event={event} cellDate={event.adjustedStart} position="middle" />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
