// SPDX-License-Identifier: AGPL-3.0-only
import { startOfWeek, addDays, format, isSameDay, areIntervalsOverlapping } from "date-fns";

import { useCalendar } from "../../contexts/calendar-context";

import { ScrollArea } from "../../ui/scroll-area";

import { AddEventDialog } from "../dialogs/add-event-dialog";
import { EventBlock } from "./event-block";
import { DroppableTimeBlock } from "../dnd/droppable-time-block";
import { CalendarTimeline } from "./calendar-time-line";
import { WeekViewMultiDayEventsRow } from "./week-view-multi-day-events-row";

import { cn } from "../../lib/cn";
import {
  groupEvents,
  getEventBlockStyle,
  isWorkingHour,
  getVisibleHours,
  getEventStart,
  getEventEnd,
} from "../../helpers";

import type { AgendaEvent } from "../../interfaces";

interface IProps {
  singleDayEvents: AgendaEvent[];
  multiDayEvents: AgendaEvent[];
}

export function CalendarWeekView({ singleDayEvents, multiDayEvents }: IProps) {
  const { selectedDate, workingHours, visibleHours } = useCalendar();

  const { hours, earliestEventHour, latestEventHour } = getVisibleHours(
    visibleHours,
    singleDayEvents,
  );

  const weekStart = startOfWeek(selectedDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <>
      <div className="flex flex-col items-center justify-center border-b py-4 text-sm text-m3-secondary sm:hidden">
        <p>Weekly view is not available on smaller devices.</p>
        <p>Please switch to daily or monthly view.</p>
      </div>

      <div className="hidden flex-col sm:flex">
        <div>
          <WeekViewMultiDayEventsRow selectedDate={selectedDate} multiDayEvents={multiDayEvents} />

          {/* Week header */}
          <div className="relative z-20 flex border-b">
            <div className="w-18"></div>
            <div className="grid flex-1 grid-cols-7 divide-x divide-m3-border">
              {weekDays.map((day, index) => (
                <span
                  key={index}
                  className="py-2 text-center text-xs font-medium text-m3-secondary"
                >
                  {format(day, "EE")}{" "}
                  <span className="ml-1 font-semibold text-m3-text">{format(day, "d")}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        <ScrollArea className="h-[800px]" type="always">
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

            {/* Week grid */}
            <div className="relative flex flex-1 border-l">
              <div className="grid flex-1 grid-cols-7 divide-x divide-m3-border">
                {weekDays.map((day, dayIndex) => {
                  const dayEvents = singleDayEvents.filter((event) =>
                    isSameDay(getEventStart(event), day),
                  );
                  const groupedEvents = groupEvents(dayEvents);

                  return (
                    <div key={dayIndex} className="relative">
                      {hours.map((hour, index) => {
                        const isDisabled = !isWorkingHour(day, hour, workingHours);

                        return (
                          <div
                            key={hour}
                            className={cn(
                              "relative",
                              isDisabled &&
                                "bg-[repeating-linear-gradient(-60deg,var(--m3-border)_0_0.5px,transparent_0.5px_8px)]",
                            )}
                            style={{ height: "96px" }}
                          >
                            {index !== 0 && (
                              <div className="pointer-events-none absolute inset-x-0 top-0 border-b border-m3-border/40"></div>
                            )}

                            <DroppableTimeBlock date={day} hour={hour} minute={0}>
                              <AddEventDialog startDate={day} startTime={{ hour, minute: 0 }}>
                                <div className="absolute inset-x-0 top-0 h-[24px] cursor-pointer transition-colors hover:bg-m3-hover" />
                              </AddEventDialog>
                            </DroppableTimeBlock>

                            <DroppableTimeBlock date={day} hour={hour} minute={15}>
                              <AddEventDialog startDate={day} startTime={{ hour, minute: 15 }}>
                                <div className="absolute inset-x-0 top-[24px] h-[24px] cursor-pointer transition-colors hover:bg-m3-hover" />
                              </AddEventDialog>
                            </DroppableTimeBlock>

                            <div className="pointer-events-none absolute inset-x-0 top-1/2 border-b border-dashed border-m3-border/30"></div>

                            <DroppableTimeBlock date={day} hour={hour} minute={30}>
                              <AddEventDialog startDate={day} startTime={{ hour, minute: 30 }}>
                                <div className="absolute inset-x-0 top-[48px] h-[24px] cursor-pointer transition-colors hover:bg-m3-hover" />
                              </AddEventDialog>
                            </DroppableTimeBlock>

                            <DroppableTimeBlock date={day} hour={hour} minute={45}>
                              <AddEventDialog startDate={day} startTime={{ hour, minute: 45 }}>
                                <div className="absolute inset-x-0 top-[72px] h-[24px] cursor-pointer transition-colors hover:bg-m3-hover" />
                              </AddEventDialog>
                            </DroppableTimeBlock>
                          </div>
                        );
                      })}

                      {groupedEvents.map((group, groupIndex) =>
                        group.map((event) => {
                          let style = getEventBlockStyle(
                            event,
                            day,
                            groupIndex,
                            groupedEvents.length,
                            { from: earliestEventHour, to: latestEventHour },
                          );
                          const hasOverlap = groupedEvents.some(
                            (otherGroup, otherIndex) =>
                              otherIndex !== groupIndex &&
                              otherGroup.some((otherEvent) =>
                                areIntervalsOverlapping(
                                  { start: getEventStart(event), end: getEventEnd(event) },
                                  {
                                    start: getEventStart(otherEvent),
                                    end: getEventEnd(otherEvent),
                                  },
                                ),
                              ),
                          );

                          if (!hasOverlap) style = { ...style, width: "100%", left: "0%" };

                          return (
                            <div key={event.id} className="absolute p-1" style={style}>
                              <EventBlock event={event} />
                            </div>
                          );
                        }),
                      )}
                    </div>
                  );
                })}
              </div>

              <CalendarTimeline
                firstVisibleHour={earliestEventHour}
                lastVisibleHour={latestEventHour}
              />
            </div>
          </div>
        </ScrollArea>
      </div>
    </>
  );
}
