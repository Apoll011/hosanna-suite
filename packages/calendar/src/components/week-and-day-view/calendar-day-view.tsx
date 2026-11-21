import { useEffect, useState } from "react";
import {
  Clock,
  MapPin,
  Tag,
  FileText,
  Users,
  Plus,
  Pencil,
  Trash2,
  Printer,
  X,
} from "lucide-react";
import { format, isSameDay, areIntervalsOverlapping } from "date-fns";

import { useCalendar } from "../../contexts/calendar-context";

import { Calendar } from "../../ui/calendar";
import { ScrollArea } from "../../ui/scroll-area";
import { Button } from "../../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";

import { AddEventDialog } from "../dialogs/add-event-dialog";
import { EditEventDialog } from "../dialogs/edit-event-dialog";
import { EventBlock } from "./event-block";
import { DroppableTimeBlock } from "../dnd/droppable-time-block";
import { CalendarTimeline } from "./calendar-time-line";
import { DayViewMultiDayEventsRow } from "./day-view-multi-day-events-row";

import { cn } from "../../lib/cn";
import {
  groupEvents,
  getEventBlockStyle,
  isWorkingHour,
  getVisibleHours,
  getEventStart,
  getEventEnd,
  getEventColor,
} from "../../helpers";

import type { AgendaEvent } from "../../interfaces";

interface IProps {
  singleDayEvents: AgendaEvent[];
  multiDayEvents: AgendaEvent[];
}

const COLOR_CLASSES: Record<string, string> = {
  blue: "bg-blue-500",
  green: "bg-emerald-500",
  red: "bg-red-500",
  yellow: "bg-amber-400",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
  gray: "bg-neutral-500",
};

export function CalendarDayView({ singleDayEvents, multiDayEvents }: IProps) {
  const {
    selectedDate,
    setSelectedDate,
    visibleHours,
    workingHours,
    setSelectedEventId,
    selectedEvent,
    categories,
    deleteEvent,
    addResponsibility,
    editAssignees,
    removeResponsibility,
    printEvent,
    canCreate,
    canUpdate,
    canDelete,
  } = useCalendar();

  const [, setCurrentTime] = useState(new Date());
  const [isNewEventOpen, setIsNewEventOpen] = useState(false);
  const [isEditEventOpen, setIsEditEventOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const { hours, earliestEventHour, latestEventHour } = getVisibleHours(visibleHours, singleDayEvents);

  const dayEvents = singleDayEvents.filter(event => isSameDay(getEventStart(event), selectedDate));
  const groupedEvents = groupEvents(dayEvents);

  const categoriesById = new Map(categories.map(c => [c.id, c]));

  // If selectedEvent is not on selectedDate, fall back to null
  const currentSelectedEvent =
    selectedEvent && isSameDay(getEventStart(selectedEvent), selectedDate) ? selectedEvent : null;

  return (
    <div className="flex flex-col lg:flex-row">
      {/* Left side: Timeline */}
      <div className="flex flex-1 flex-col min-w-0">
        <div>
          <DayViewMultiDayEventsRow selectedDate={selectedDate} multiDayEvents={multiDayEvents} />

          {/* Day header */}
          <div className="relative z-20 flex border-b items-center justify-between pr-4">
            <div className="flex items-center flex-1">
              <div className="w-18"></div>
              <span className="flex-1 border-l py-2 text-center text-xs font-medium text-m3-secondary">
                {format(selectedDate, "EEEE")},{" "}
                <span className="font-semibold text-m3-text">{format(selectedDate, "d MMMM yyyy")}</span>
              </span>
            </div>

            {canCreate && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1 text-xs"
                onClick={() => setIsNewEventOpen(true)}
              >
                <Plus className="size-3.5" />
                Add Event
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[750px]" type="always">
          <div className="flex">
            {/* Hours column */}
            <div className="relative w-18">
              {hours.map((hour, index) => (
                <div key={hour} className="relative" style={{ height: "96px" }}>
                  <div className="absolute -top-3 right-2 flex h-6 items-center">
                    {index !== 0 && (
                      <span className="text-xs text-m3-secondary">
                        {format(new Date().setHours(hour, 0, 0, 0), "HH:mm")}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="relative flex-1 border-l">
              <div className="relative">
                {hours.map((hour, index) => {
                  const isDisabled = !isWorkingHour(selectedDate, hour, workingHours);

                  return (
                    <div
                      key={hour}
                      className={cn(
                        "relative",
                        isDisabled &&
                          "bg-[repeating-linear-gradient(-60deg,var(--m3-border)_0_0.5px,transparent_0.5px_8px)]"
                      )}
                      style={{ height: "96px" }}
                    >
                      {index !== 0 && <div className="pointer-events-none absolute inset-x-0 top-0 border-b border-m3-border/40"></div>}

                      <DroppableTimeBlock date={selectedDate} hour={hour} minute={0}>
                        <AddEventDialog startDate={selectedDate} startTime={{ hour, minute: 0 }}>
                          <div className="absolute inset-x-0 top-0 h-[24px] cursor-pointer transition-colors hover:bg-m3-hover" />
                        </AddEventDialog>
                      </DroppableTimeBlock>

                      <DroppableTimeBlock date={selectedDate} hour={hour} minute={15}>
                        <AddEventDialog startDate={selectedDate} startTime={{ hour, minute: 15 }}>
                          <div className="absolute inset-x-0 top-[24px] h-[24px] cursor-pointer transition-colors hover:bg-m3-hover" />
                        </AddEventDialog>
                      </DroppableTimeBlock>

                      <div className="pointer-events-none absolute inset-x-0 top-1/2 border-b border-dashed border-m3-border/30"></div>

                      <DroppableTimeBlock date={selectedDate} hour={hour} minute={30}>
                        <AddEventDialog startDate={selectedDate} startTime={{ hour, minute: 30 }}>
                          <div className="absolute inset-x-0 top-[48px] h-[24px] cursor-pointer transition-colors hover:bg-m3-hover" />
                        </AddEventDialog>
                      </DroppableTimeBlock>

                      <DroppableTimeBlock date={selectedDate} hour={hour} minute={45}>
                        <AddEventDialog startDate={selectedDate} startTime={{ hour, minute: 45 }}>
                          <div className="absolute inset-x-0 top-[72px] h-[24px] cursor-pointer transition-colors hover:bg-m3-hover" />
                        </AddEventDialog>
                      </DroppableTimeBlock>
                    </div>
                  );
                })}

                {groupedEvents.map((group, groupIndex) =>
                  group.map(event => {
                    let style = getEventBlockStyle(event, selectedDate, groupIndex, groupedEvents.length, {
                      from: earliestEventHour,
                      to: latestEventHour,
                    });
                    const hasOverlap = groupedEvents.some(
                      (otherGroup, otherIndex) =>
                        otherIndex !== groupIndex &&
                        otherGroup.some(otherEvent =>
                          areIntervalsOverlapping(
                            { start: getEventStart(event), end: getEventEnd(event) },
                            { start: getEventStart(otherEvent), end: getEventEnd(otherEvent) }
                          )
                        )
                    );

                    if (!hasOverlap) style = { ...style, width: "100%", left: "0%" };

                    return (
                      <div key={event.id} className="absolute p-1" style={style}>
                        <EventBlock event={event} />
                      </div>
                    );
                  })
                )}
              </div>

              <CalendarTimeline firstVisibleHour={earliestEventHour} lastVisibleHour={latestEventHour} />
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Right side: Mini calendar + Event Details */}
      <div className="w-full lg:w-84 xl:w-96 divide-y border-l bg-m3-card flex flex-col shrink-0">
        {/* Top: Small month calendar with day picker */}
        <div className="p-3 flex flex-col items-center">
          <Calendar
            className="mx-auto w-fit"
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            initialFocus
          />
        </div>

        {/* Bottom: Event details or Day list */}
        <div className="flex-1 p-4 overflow-y-auto">
          {currentSelectedEvent ? (
            /* Selected Event Details Section */
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2 border-b pb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`size-2.5 rounded-full shrink-0 ${
                        COLOR_CLASSES[getEventColor(currentSelectedEvent)] ?? "bg-blue-500"
                      }`}
                    />
                    <h3 className="font-semibold text-base text-m3-text truncate">
                      {currentSelectedEvent.title}
                    </h3>
                  </div>
                  {currentSelectedEvent.type && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-m3-sidebar text-m3-secondary mt-1">
                      <Tag className="size-3" />
                      {currentSelectedEvent.type}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {printEvent && (
                    <button
                      type="button"
                      onClick={() => printEvent(currentSelectedEvent)}
                      className="p-1 rounded-md text-m3-secondary hover:text-m3-text hover:bg-m3-hover cursor-pointer"
                      title="Print Event"
                    >
                      <Printer className="size-4" />
                    </button>
                  )}

                  {canUpdate && (
                    <button
                      type="button"
                      onClick={() => setIsEditEventOpen(true)}
                      className="p-1 rounded-md text-m3-secondary hover:text-m3-primary hover:bg-m3-hover cursor-pointer"
                      title="Edit Event"
                    >
                      <Pencil className="size-4" />
                    </button>
                  )}

                  {canDelete && deleteEvent && (
                    <button
                      type="button"
                      onClick={() => deleteEvent(currentSelectedEvent)}
                      className="p-1 rounded-md text-m3-secondary hover:text-red-600 hover:bg-m3-hover cursor-pointer"
                      title="Delete Event"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedEventId(null)}
                    className="p-1 rounded-md text-m3-secondary hover:text-m3-text hover:bg-m3-hover cursor-pointer ml-1"
                    title="Close Details"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>

              {/* Time & Duration */}
              <div className="flex items-center gap-2 text-xs text-m3-secondary">
                <Clock className="size-4 shrink-0 text-m3-primary" />
                <span>
                  {currentSelectedEvent.time || format(getEventStart(currentSelectedEvent), "HH:mm")}
                  {currentSelectedEvent.durationMinutes ? ` (${currentSelectedEvent.durationMinutes} min)` : ""}
                </span>
              </div>

              {/* Location */}
              {currentSelectedEvent.location && (
                <div className="flex items-center gap-2 text-xs text-m3-secondary">
                  <MapPin className="size-4 shrink-0 text-m3-primary" />
                  <span className="truncate">{currentSelectedEvent.location}</span>
                </div>
              )}

              {/* Notes */}
              {currentSelectedEvent.notes && (
                <div className="flex items-start gap-2 text-xs text-m3-secondary bg-m3-sidebar/50 p-2.5 rounded-md">
                  <FileText className="size-4 shrink-0 text-m3-primary mt-0.5" />
                  <p className="whitespace-pre-line text-m3-text/90">{currentSelectedEvent.notes}</p>
                </div>
              )}

              {/* Responsibilities Section */}
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-m3-text">
                    <Users className="size-4 text-m3-primary" />
                    <span>Responsibilities</span>
                    <span className="text-[11px] bg-m3-sidebar rounded-full px-1.5 py-0.2">
                      {currentSelectedEvent.responsibilities?.length ?? 0}
                    </span>
                  </div>

                  {canUpdate && addResponsibility && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1 text-m3-primary hover:text-m3-primary"
                      onClick={() => addResponsibility(currentSelectedEvent.id)}
                    >
                      <Plus className="size-3.5" />
                      Add
                    </Button>
                  )}
                </div>

                {(!currentSelectedEvent.responsibilities || currentSelectedEvent.responsibilities.length === 0) ? (
                  <p className="text-xs text-m3-secondary italic py-2 text-center">
                    No responsibilities assigned.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {currentSelectedEvent.responsibilities.map(r => {
                      const cat = categoriesById.get(r.categoryId);
                      return (
                        <div
                          key={r.id}
                          className="rounded-lg border border-m3-border bg-m3-sidebar/30 p-2.5 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-m3-text">
                              {cat?.label ?? "Responsibility"}
                            </span>

                            <div className="flex items-center gap-1">
                              {canUpdate && editAssignees && (
                                <button
                                  type="button"
                                  onClick={() => editAssignees(currentSelectedEvent.id, r.id)}
                                  className="p-1 rounded text-m3-secondary hover:text-m3-primary hover:bg-m3-hover cursor-pointer"
                                  title="Edit Assignees"
                                >
                                  <Pencil className="size-3" />
                                </button>
                              )}

                              {canUpdate && removeResponsibility && (
                                <button
                                  type="button"
                                  onClick={() => removeResponsibility(currentSelectedEvent.id, r.id)}
                                  className="p-1 rounded text-m3-secondary hover:text-red-600 hover:bg-m3-hover cursor-pointer"
                                  title="Remove Responsibility"
                                >
                                  <Trash2 className="size-3" />
                                </button>
                              )}
                            </div>
                          </div>

                          {r.assignees.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {r.assignees.map((assignee, idx) => (
                                <div
                                  key={idx}
                                  className="inline-flex items-center gap-1.5 rounded-full bg-m3-card border border-m3-border px-2 py-0.5 text-xs"
                                >
                                  <Avatar className="size-4 text-[9px]">
                                    <AvatarImage src={assignee.avatarUrl} alt={assignee.name} />
                                    <AvatarFallback>{assignee.name[0] ?? "?"}</AvatarFallback>
                                  </Avatar>
                                  <span className="text-m3-text font-medium">{assignee.name}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[11px] text-m3-secondary italic">No assignees</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Day Event List (when no event is selected) */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-m3-secondary uppercase tracking-wider">
                  Events on {format(selectedDate, "d MMM")}
                </h4>
                <span className="text-xs font-bold text-m3-primary bg-m3-sidebar rounded-full px-2 py-0.5">
                  {dayEvents.length}
                </span>
              </div>

              {dayEvents.length === 0 ? (
                <div className="py-6 text-center space-y-2">
                  <p className="text-xs text-m3-secondary italic">No events scheduled for this day</p>
                  {canCreate && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1 text-xs"
                      onClick={() => setIsNewEventOpen(true)}
                    >
                      <Plus className="size-3.5" />
                      Add Event
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {dayEvents.map(event => {
                    const respCount = event.responsibilities?.length ?? 0;
                    return (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => setSelectedEventId(event.id)}
                        className="w-full text-left rounded-lg p-2.5 border border-m3-border hover:border-m3-primary/40 hover:bg-m3-hover transition-colors cursor-pointer flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-xs font-semibold text-m3-text">
                            <span
                              className={`size-2 rounded-full shrink-0 ${
                                COLOR_CLASSES[getEventColor(event)] ?? "bg-blue-500"
                              }`}
                            />
                            <span>{event.time}</span>
                            <span className="truncate">{event.title}</span>
                          </div>
                          {event.type && (
                            <p className="text-[11px] text-m3-secondary mt-0.5 ml-4 truncate">
                              {event.type}
                            </p>
                          )}
                        </div>

                        {respCount > 0 && (
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-m3-secondary shrink-0">
                            <Users className="size-3.5 text-m3-primary" />
                            <span>{respCount}</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dialogs for Day View */}
      <AddEventDialog
        open={isNewEventOpen}
        onOpenChange={setIsNewEventOpen}
        startDate={selectedDate}
      />

      {currentSelectedEvent && (
        <EditEventDialog
          open={isEditEventOpen}
          onOpenChange={setIsEditEventOpen}
          event={currentSelectedEvent}
        />
      )}
    </div>
  );
}
