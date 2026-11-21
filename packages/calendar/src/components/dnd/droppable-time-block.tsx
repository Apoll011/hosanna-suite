"use client";

import { useDrop } from "react-dnd";
import { format, differenceInMilliseconds } from "date-fns";

import { useUpdateEvent } from "../../hooks/use-update-event";
import { getEventStart, getEventEnd } from "../../helpers";

import { cn } from "../../lib/cn";
import { ItemTypes } from "./draggable-event";

import type { AgendaEvent } from "../../interfaces";

interface DroppableTimeBlockProps {
  date: Date;
  hour: number;
  minute: number;
  children: React.ReactNode;
}

export function DroppableTimeBlock({ date, hour, minute, children }: DroppableTimeBlockProps) {
  const { updateEvent } = useUpdateEvent();

  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: ItemTypes.EVENT,
      drop: (item: { event: AgendaEvent }) => {
        const droppedEvent = item.event;

        const eventStartDate = getEventStart(droppedEvent);
        const eventEndDate = getEventEnd(droppedEvent);
        const eventDurationMs = differenceInMilliseconds(eventEndDate, eventStartDate);

        const newStartDate = new Date(date);
        newStartDate.setHours(hour, minute, 0, 0);
        const newEndDate = new Date(newStartDate.getTime() + eventDurationMs);
        const newDate = format(newStartDate, "yyyy-MM-dd");
        const newTime = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

        updateEvent({
          ...droppedEvent,
          date: newDate,
          time: newTime,
          startDate: newStartDate.toISOString(),
          endDate: newEndDate.toISOString(),
        });

        return { moved: true };
      },
      collect: monitor => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [date, hour, minute, updateEvent]
  );

  return (
    <div ref={drop as unknown as React.RefObject<HTMLDivElement>} className={cn("h-[24px]", isOver && canDrop && "bg-m3-hover/50")}>
      {children}
    </div>
  );
}
