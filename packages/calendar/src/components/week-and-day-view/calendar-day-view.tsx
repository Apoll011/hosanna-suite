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
  Link2,
  ExternalLink,
  MoreVertical,
  UserPlus,
} from "lucide-react";
import { format, isSameDay, areIntervalsOverlapping } from "date-fns";

import { useCalendar } from "../../contexts/calendar-context";

import { SideMonthCalendar } from "./side-month-calendar";
import { ScrollArea } from "../../ui/scroll-area";
import { Button } from "../../ui/button";

import { EventFormModal } from "../dialogs/event-form-modal";
import { EventBlock } from "./event-block";
import { DroppableTimeBlock } from "../dnd/droppable-time-block";
import { CalendarTimeline } from "./calendar-time-line";
import { DayViewMultiDayEventsRow } from "./day-view-multi-day-events-row";
import { AvatarStack } from "../common/avatar-stack";
import { COLOR_MAP, ICON_MAP } from "../../utils/icon-map";
import { serviceTotalMinutes } from "../dialogs/service-link-field";

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

import type { AgendaEvent, EventFormValue, ResponsibilityColor, ResponsibilityIconKey } from "../../interfaces";

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
    services,
    onOpenService,
    onRequestCreateEvent,
    onRequestEditEvent,
    createEvent,
    updateEvent,
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
  const [modalInitial, setModalInitial] = useState<Partial<EventFormValue>>({});
  const [openRespMenuId, setOpenRespMenuId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const { hours, earliestEventHour, latestEventHour } = getVisibleHours(visibleHours, singleDayEvents);

  const dayEvents = singleDayEvents.filter(event => isSameDay(getEventStart(event), selectedDate));
  const groupedEvents = groupEvents(dayEvents);

  const categoriesById = new Map(categories.map(c => [c.id, c]));

  const currentSelectedEvent =
    selectedEvent && isSameDay(getEventStart(selectedEvent), selectedDate) ? selectedEvent : null;

  const linkedService =
    currentSelectedEvent?.linkedServiceId && services
      ? services.find(s => s.id === currentSelectedEvent.linkedServiceId) ?? null
      : null;

  const handleOpenCreateModal = (time?: string) => {
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    if (onRequestCreateEvent) {
      onRequestCreateEvent({ date: dateStr, time: time ?? "10:00" });
    } else {
      setModalInitial({ date: dateStr, time: time ?? "10:00" });
      setIsNewEventOpen(true);
    }
  };

  const handleOpenEditModal = (event: AgendaEvent) => {
    if (onRequestEditEvent) {
      onRequestEditEvent(event);
    } else {
      setModalInitial({
        title: event.title,
        type: event.type,
        date: event.date,
        time: event.time,
        durationMinutes: event.durationMinutes,
        location: event.location ?? "",
        notes: event.notes ?? "",
        color: (event.color as any) ?? "blue",
        linkedServiceId: event.linkedServiceId ?? null,
      });
      setIsEditEventOpen(true);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-210px)] min-h-[620px] w-full overflow-hidden bg-m3-card">
      {/* Left side: Timeline */}
      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        {/* Day header: Fixed / Sticky */}
        <div className="shrink-0 bg-m3-card border-b z-20">
          <DayViewMultiDayEventsRow selectedDate={selectedDate} multiDayEvents={multiDayEvents} />

          <div className="flex items-center justify-between px-4 py-2.5">
            <div className="flex items-center flex-1 min-w-0">
              <div className="w-18 shrink-0"></div>
              <span className="flex-1 border-l pl-4 text-left text-sm font-semibold text-m3-text">
                {format(selectedDate, "EEEE")},{" "}
                <span className="text-m3-secondary font-normal">{format(selectedDate, "d MMMM yyyy")}</span>
              </span>
            </div>

            {canCreate && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs font-semibold shrink-0 cursor-pointer"
                onClick={() => handleOpenCreateModal()}
              >
                <Plus className="size-3.5" />
                Add Event
              </Button>
            )}
          </div>
        </div>

        {/* Timeline ScrollArea: Scrolls independently */}
        <ScrollArea className="flex-1 min-h-0 w-full" type="always">
          <div className="flex w-full min-w-full">
            {/* Hours column */}
            <div className="relative w-18 shrink-0">
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

            {/* Day grid: Expands to full width */}
            <div className="relative flex-1 min-w-0 border-l">
              <div className="relative w-full">
                {hours.map((hour, index) => {
                  const isDisabled = !isWorkingHour(selectedDate, hour, workingHours);

                  return (
                    <div
                      key={hour}
                      className={cn(
                        "relative w-full",
                        isDisabled &&
                          "bg-[repeating-linear-gradient(-60deg,var(--m3-border)_0_0.5px,transparent_0.5px_8px)]"
                      )}
                      style={{ height: "96px" }}
                    >
                      {index !== 0 && <div className="pointer-events-none absolute inset-x-0 top-0 border-b border-m3-border/40"></div>}

                      <DroppableTimeBlock date={selectedDate} hour={hour} minute={0}>
                        <div
                          onClick={() => handleOpenCreateModal(`${String(hour).padStart(2, "0")}:00`)}
                          className="absolute inset-x-0 top-0 h-[24px] cursor-pointer transition-colors hover:bg-m3-hover"
                        />
                      </DroppableTimeBlock>

                      <DroppableTimeBlock date={selectedDate} hour={hour} minute={15}>
                        <div
                          onClick={() => handleOpenCreateModal(`${String(hour).padStart(2, "0")}:15`)}
                          className="absolute inset-x-0 top-[24px] h-[24px] cursor-pointer transition-colors hover:bg-m3-hover"
                        />
                      </DroppableTimeBlock>

                      <div className="pointer-events-none absolute inset-x-0 top-1/2 border-b border-dashed border-m3-border/30"></div>

                      <DroppableTimeBlock date={selectedDate} hour={hour} minute={30}>
                        <div
                          onClick={() => handleOpenCreateModal(`${String(hour).padStart(2, "0")}:30`)}
                          className="absolute inset-x-0 top-[48px] h-[24px] cursor-pointer transition-colors hover:bg-m3-hover"
                        />
                      </DroppableTimeBlock>

                      <DroppableTimeBlock date={selectedDate} hour={hour} minute={45}>
                        <div
                          onClick={() => handleOpenCreateModal(`${String(hour).padStart(2, "0")}:45`)}
                          className="absolute inset-x-0 top-[72px] h-[24px] cursor-pointer transition-colors hover:bg-m3-hover"
                        />
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
      <div className="w-full lg:w-84 xl:w-96 divide-y border-l bg-m3-card flex flex-col shrink-0 h-full overflow-hidden">
        {/* Top: Small month calendar (Pinned / Sticky, full-width) */}
        <div className="p-4 shrink-0 border-b">
          <SideMonthCalendar
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            events={singleDayEvents}
          />
        </div>

        {/* Bottom: Event details or Day list (Scrolls independently) */}
        <div className="flex-1 min-h-0 p-4 overflow-y-auto">
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
                      onClick={() => handleOpenEditModal(currentSelectedEvent)}
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

              {/* Linked Service */}
              {linkedService && (
                <div className="border-t pt-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-m3-secondary">
                    <Link2 className="size-3.5 text-m3-primary" />
                    <span>Linked Service</span>
                  </div>
                  <div className="bg-m3-sidebar/50 rounded-xl p-3 border border-m3-border/60">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-m3-text truncate min-w-0">
                        {linkedService.name}
                      </span>
                      {onOpenService && (
                        <button
                          type="button"
                          onClick={() => onOpenService(linkedService.id)}
                          className="text-m3-primary hover:text-m3-primary/80 flex items-center gap-1 text-xs font-semibold cursor-pointer shrink-0"
                          title="Open Service"
                        >
                          <span>Open</span>
                          <ExternalLink className="size-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-m3-secondary mt-1">
                      {linkedService.date}
                      {linkedService.elements?.length ? ` · ${serviceTotalMinutes(linkedService)} min` : ""}
                    </p>
                  </div>
                </div>
              )}

              {/* Notes */}
              {currentSelectedEvent.notes && (
                <div className="flex items-start gap-2 text-xs text-m3-secondary bg-m3-sidebar/50 p-2.5 rounded-lg border border-m3-border/40">
                  <FileText className="size-4 shrink-0 text-m3-primary mt-0.5" />
                  <p className="whitespace-pre-line text-m3-text/90 leading-relaxed">
                    {currentSelectedEvent.notes}
                  </p>
                </div>
              )}

              {/* Responsibilities Section */}
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-m3-text">
                    <Users className="size-4 text-m3-primary" />
                    <span>Responsibilities</span>
                    <span className="text-[11px] bg-m3-sidebar rounded-full px-2 py-0.5 font-bold">
                      {currentSelectedEvent.responsibilities?.length ?? 0}
                    </span>
                  </div>

                  {canUpdate && addResponsibility && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1 text-m3-primary hover:text-m3-primary cursor-pointer"
                      onClick={() => addResponsibility(currentSelectedEvent.id)}
                    >
                      <Plus className="size-3.5" />
                      Add
                    </Button>
                  )}
                </div>

                {(!currentSelectedEvent.responsibilities || currentSelectedEvent.responsibilities.length === 0) ? (
                  <p className="text-xs text-m3-secondary italic py-3 text-center">
                    No responsibilities assigned.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {currentSelectedEvent.responsibilities.map(r => {
                      const cat = categoriesById.get(r.categoryId);
                      const iconKey = (cat?.icon ?? "custom") as ResponsibilityIconKey;
                      const IconComponent = ICON_MAP[iconKey] ?? ICON_MAP.custom;
                      const colorKey = (cat?.color ?? "slate") as ResponsibilityColor;
                      const colorScheme = COLOR_MAP[colorKey] ?? COLOR_MAP.slate;
                      const isMenuOpen = openRespMenuId === r.id;

                      return (
                        <div
                          key={r.id}
                          className="rounded-xl border border-m3-border/80 bg-m3-card p-3 space-y-2 shadow-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${colorScheme.bg} ${colorScheme.text}`}
                              >
                                <IconComponent className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-xs font-bold text-m3-text truncate">
                                {cat?.label ?? "Responsibility"}
                              </span>
                            </div>

                            {canUpdate && (
                              <div className="relative shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setOpenRespMenuId(isMenuOpen ? null : r.id)}
                                  className="p-1 rounded-md text-m3-secondary hover:text-m3-text hover:bg-m3-hover cursor-pointer"
                                  title="Options"
                                >
                                  <MoreVertical className="size-3.5" />
                                </button>

                                {isMenuOpen && (
                                  <div className="absolute right-0 mt-1 w-44 bg-m3-card border border-m3-border rounded-xl shadow-xl z-30 p-1 space-y-0.5">
                                    {editAssignees && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenRespMenuId(null);
                                          editAssignees(currentSelectedEvent.id, r.id);
                                        }}
                                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-m3-text hover:bg-m3-hover rounded-lg transition-colors cursor-pointer text-left"
                                      >
                                        <UserPlus className="w-3.5 h-3.5 text-m3-primary" />
                                        <span>Edit Assignees</span>
                                      </button>
                                    )}
                                    {removeResponsibility && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenRespMenuId(null);
                                          removeResponsibility(currentSelectedEvent.id, r.id);
                                        }}
                                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer text-left"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Remove</span>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="pt-1">
                            <AvatarStack assignees={r.assignees} />
                          </div>
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
                <div className="py-8 text-center space-y-2">
                  <p className="text-xs text-m3-secondary italic">No events scheduled for this day</p>
                  {canCreate && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1 text-xs cursor-pointer"
                      onClick={() => handleOpenCreateModal()}
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

      {/* Internal Modals (Fallback if not handled by host) */}
      <EventFormModal
        isOpen={isNewEventOpen}
        onClose={() => setIsNewEventOpen(false)}
        initial={modalInitial}
        title="New Event"
        submitLabel="Create Event"
        services={services}
        onSubmit={(formVal) => {
          createEvent({
            id: `evt-${Date.now()}`,
            ...formVal,
            responsibilities: [],
          });
          setIsNewEventOpen(false);
        }}
      />

      {currentSelectedEvent && (
        <EventFormModal
          isOpen={isEditEventOpen}
          onClose={() => setIsEditEventOpen(false)}
          initial={modalInitial}
          title="Edit Event"
          submitLabel="Save Changes"
          services={services}
          onDelete={
            canDelete && deleteEvent
              ? () => {
                  deleteEvent(currentSelectedEvent);
                  setIsEditEventOpen(false);
                }
              : undefined
          }
          onSubmit={(formVal) => {
            updateEvent({
              ...currentSelectedEvent,
              ...formVal,
            });
            setIsEditEventOpen(false);
          }}
        />
      )}
    </div>
  );
}
