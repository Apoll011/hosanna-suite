"use client";

import { format } from "date-fns";
import { cva } from "class-variance-authority";
import { Clock, MapPin, Tag, Users } from "lucide-react";

import { useCalendar } from "../../contexts/calendar-context";
import { getEventStart, getEventEnd, getEventColor } from "../../helpers";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";

import type { AgendaEvent } from "../../interfaces";
import type { VariantProps } from "class-variance-authority";

const agendaEventCardVariants = cva(
  "flex select-none items-center justify-between gap-3 rounded-md px-3 py-2.5 text-sm hover:bg-m3-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-m3-primary cursor-pointer border border-transparent transition-colors",
  {
    variants: {
      color: {
        blue: "hover:border-m3-primary/30 [&_.event-dot]:fill-m3-primary",
        green: "hover:border-green-500/30 [&_.event-dot]:fill-green-600",
        red: "hover:border-red-500/30 [&_.event-dot]:fill-red-600",
        yellow: "hover:border-amber-400/30 [&_.event-dot]:fill-amber-500",
        purple: "hover:border-purple-500/30 [&_.event-dot]:fill-purple-600",
        orange: "hover:border-orange-500/30 [&_.event-dot]:fill-orange-600",
        gray: "hover:border-neutral-500/30 [&_.event-dot]:fill-neutral-600",

        "blue-dot": "[&_.event-dot]:fill-m3-primary",
        "green-dot": "[&_.event-dot]:fill-green-600",
        "red-dot": "[&_.event-dot]:fill-red-600",
        "orange-dot": "[&_.event-dot]:fill-orange-600",
        "purple-dot": "[&_.event-dot]:fill-purple-600",
        "yellow-dot": "[&_.event-dot]:fill-yellow-600",
        "gray-dot": "[&_.event-dot]:fill-neutral-600",
      },
    },
    defaultVariants: {
      color: "blue-dot",
    },
  }
);

interface IProps {
  event: AgendaEvent;
  eventCurrentDay?: number;
  eventTotalDays?: number;
}

export function AgendaEventCard({ event, eventCurrentDay, eventTotalDays }: IProps) {
  const { badgeVariant, selectEvent, categories, selectedEventId } = useCalendar();

  const startDate = getEventStart(event);
  const endDate = getEventEnd(event);

  const eventColor = getEventColor(event);
  const color = (badgeVariant === "dot" ? `${eventColor}-dot` : eventColor) as VariantProps<typeof agendaEventCardVariants>["color"];

  const isSelected = selectedEventId === event.id;
  const agendaEventCardClasses = agendaEventCardVariants({ color });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      selectEvent(event);
    }
  };

  const categoriesById = new Map(categories.map(c => [c.id, c]));
  const allAssignees = event.responsibilities?.flatMap(r => r.assignees) ?? [];

  return (
    <div
      role="button"
      tabIndex={0}
      className={`${agendaEventCardClasses} ${isSelected ? "bg-m3-primary/10 border-m3-primary/30" : ""}`}
      onClick={() => selectEvent(event)}
      onKeyDown={handleKeyDown}
    >
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {["mixed", "dot"].includes(badgeVariant) && (
            <svg width="8" height="8" viewBox="0 0 8 8" className="event-dot shrink-0">
              <circle cx="4" cy="4" r="4" />
            </svg>
          )}

          <p className="font-semibold text-m3-text truncate">
            {eventCurrentDay && eventTotalDays && (
              <span className="mr-1 text-xs opacity-70">
                Day {eventCurrentDay} of {eventTotalDays} •{" "}
              </span>
            )}
            {event.title}
          </p>

          {event.type && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-m3-sidebar text-m3-secondary shrink-0">
              <Tag className="size-3" />
              {event.type}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-m3-secondary">
          <div className="flex items-center gap-1">
            <Clock className="size-3.5 shrink-0" />
            <span>
              {format(startDate, "HH:mm")} - {format(endDate, "HH:mm")}
            </span>
          </div>

          {event.location && (
            <div className="flex items-center gap-1 truncate max-w-xs">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}

          {event.responsibilities && event.responsibilities.length > 0 && (
            <div className="flex items-center gap-1">
              <Users className="size-3.5 shrink-0 text-m3-primary" />
              <span className="font-medium text-m3-primary">
                {event.responsibilities.length} {event.responsibilities.length === 1 ? "responsibility" : "responsibilities"}
              </span>
            </div>
          )}
        </div>

        {event.responsibilities && event.responsibilities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {event.responsibilities.map(r => {
              const cat = categoriesById.get(r.categoryId);
              return (
                <div key={r.id} className="inline-flex items-center gap-1 rounded bg-m3-hover px-1.5 py-0.5 text-[11px]">
                  <span className="font-medium text-m3-text">{cat?.label ?? "Resp"}:</span>
                  <span className="text-m3-secondary">
                    {r.assignees.length > 0 ? r.assignees.map(a => a.name).join(", ") : "No one"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {allAssignees.length > 0 && (
        <div className="flex -space-x-1.5 overflow-hidden shrink-0">
          {allAssignees.slice(0, 3).map((assignee, idx) => (
            <Avatar key={idx} className="size-6 border border-m3-card text-[10px]">
              <AvatarImage src={assignee.avatarUrl} alt={assignee.name} />
              <AvatarFallback>{assignee.name[0] ?? "?"}</AvatarFallback>
            </Avatar>
          ))}
          {allAssignees.length > 3 && (
            <div className="flex size-6 items-center justify-center rounded-full bg-m3-sidebar text-[10px] font-semibold text-m3-secondary border border-m3-card">
              +{allAssignees.length - 3}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
