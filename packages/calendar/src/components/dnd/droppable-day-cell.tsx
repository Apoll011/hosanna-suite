"use client";

import { useDrop } from "react-dnd";
import { format, differenceInMilliseconds } from "date-fns";

import { useUpdateEvent } from "../../hooks/use-update-event";
import { getEventStart, getEventEnd } from "../../helpers";

import { cn } from "../../lib/cn";
import { ItemTypes } from "./draggable-event";

import type { AgendaEvent, ICalendarCell } from "../../interfaces";

interface DroppableDayCellProps {
  cell: ICalendarCell;
  children: React.ReactNode;
}

export function DroppableDayCell({ cell, children }: DroppableDayCellProps) {
  const { updateEvent } = useUpdateEvent();

  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: ItemTypes.EVENT,
      drop: (item: { event: AgendaEvent }) => {
        const droppedEvent = item.event;

        const eventStartDate = getEventStart(droppedEvent);
        const eventEndDate = getEventEnd(droppedEvent);
        const eventDurationMs = differenceInMilliseconds(eventEndDate, eventStartDate);

        const newStartDate = new Date(cell.date);
        newStartDate.setHours(
          eventStartDate.getHours(),
          eventStartDate.getMinutes(),
          eventStartDate.getSeconds(),
          eventStartDate.getMilliseconds(),
        );
        const newEndDate = new Date(newStartDate.getTime() + eventDurationMs);
        const newDate = format(newStartDate, "yyyy-MM-dd");

        updateEvent({
          ...droppedEvent,
          date: newDate,
          startDate: newStartDate.toISOString(),
          endDate: newEndDate.toISOString(),
        });

        return { moved: true };
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [cell.date, updateEvent],
  );

  return (
    <div
      ref={drop as unknown as React.RefObject<HTMLDivElement>}
      className={cn(isOver && canDrop && "bg-m3-hover/50")}
    >
      {children}
    </div>
  );
}
