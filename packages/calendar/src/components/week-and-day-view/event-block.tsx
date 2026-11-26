// SPDX-License-Identifier: AGPL-3.0-only
import { cva } from "class-variance-authority";
import { format, differenceInMinutes } from "date-fns";
import { Users } from "lucide-react";

import { useCalendar } from "../../contexts/calendar-context";
import { getEventStart, getEventEnd, getEventColor } from "../../helpers";

import { DraggableEvent } from "../dnd/draggable-event";
import { cn } from "../../lib/cn";

import type { HTMLAttributes } from "react";
import type { AgendaEvent } from "../../interfaces";
import type { VariantProps } from "class-variance-authority";

const calendarWeekEventCardVariants = cva(
  "flex select-none flex-col gap-0.5 truncate whitespace-nowrap rounded-md px-2 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-m3-primary cursor-pointer transition-opacity hover:opacity-95",
  {
    variants: {
      color: {
        blue: "bg-m3-primary/10 text-m3-primary border border-m3-primary/20 [&_.event-dot]:fill-m3-primary",
        green:
          "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300 [&_.event-dot]:fill-green-600",
        red: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300 [&_.event-dot]:fill-red-600",
        yellow:
          "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300 [&_.event-dot]:fill-yellow-600",
        purple:
          "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300 [&_.event-dot]:fill-purple-600",
        orange:
          "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300 [&_.event-dot]:fill-orange-600",
        gray: "border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 [&_.event-dot]:fill-neutral-600",

        "blue-dot": "bg-m3-hover text-m3-text [&_.event-dot]:fill-m3-primary",
        "green-dot": "bg-neutral-50 dark:bg-neutral-900 [&_.event-dot]:fill-green-600",
        "red-dot": "bg-neutral-50 dark:bg-neutral-900 [&_.event-dot]:fill-red-600",
        "orange-dot": "bg-neutral-50 dark:bg-neutral-900 [&_.event-dot]:fill-orange-600",
        "purple-dot": "bg-neutral-50 dark:bg-neutral-900 [&_.event-dot]:fill-purple-600",
        "yellow-dot": "bg-neutral-50 dark:bg-neutral-900 [&_.event-dot]:fill-yellow-600",
        "gray-dot": "bg-neutral-50 dark:bg-neutral-900 [&_.event-dot]:fill-neutral-600",
      },
    },
    defaultVariants: {
      color: "blue-dot",
    },
  },
);

interface IProps
  extends
    HTMLAttributes<HTMLDivElement>,
    Omit<VariantProps<typeof calendarWeekEventCardVariants>, "color"> {
  event: AgendaEvent;
}

export function EventBlock({ event, className }: IProps) {
  const { badgeVariant, selectEvent, selectedEventId } = useCalendar();

  const start = getEventStart(event);
  const end = getEventEnd(event);
  const durationInMinutes = Math.max(15, differenceInMinutes(end, start));
  const heightInPixels = Math.max(22, (durationInMinutes / 60) * 96 - 8);

  const eventColor = getEventColor(event);
  const color = (badgeVariant === "dot" ? `${eventColor}-dot` : eventColor) as VariantProps<
    typeof calendarWeekEventCardVariants
  >["color"];

  const isSelected = selectedEventId === event.id;
  const calendarWeekEventCardClasses = cn(
    calendarWeekEventCardVariants({ color, className }),
    durationInMinutes < 35 && "py-0 justify-center",
    isSelected && "ring-2 ring-m3-primary ring-offset-1 font-bold shadow-sm",
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      selectEvent(event);
    }
  };

  const respCount = event.responsibilities?.length ?? 0;

  return (
    <DraggableEvent event={event}>
      <div
        role="button"
        tabIndex={0}
        className={calendarWeekEventCardClasses}
        style={{ height: `${heightInPixels}px` }}
        onClick={(e) => {
          e.stopPropagation();
          selectEvent(event);
        }}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-1.5 truncate">
          {["mixed", "dot"].includes(badgeVariant) && (
            <svg width="8" height="8" viewBox="0 0 8 8" className="event-dot shrink-0">
              <circle cx="4" cy="4" r="4" />
            </svg>
          )}

          <p className="truncate font-semibold">{event.title}</p>
        </div>

        {durationInMinutes > 25 && (
          <div className="flex items-center justify-between text-[11px] opacity-80 mt-0.5">
            <span>
              {format(start, "HH:mm")} - {format(end, "HH:mm")}
            </span>
            {respCount > 0 && (
              <span className="flex items-center gap-0.5 font-medium ml-1">
                <Users className="size-3" />
                {respCount}
              </span>
            )}
          </div>
        )}
      </div>
    </DraggableEvent>
  );
}
