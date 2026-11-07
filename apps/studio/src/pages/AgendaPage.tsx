/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DayAgendaList } from "@/src/components/agenda/DayAgendaList";
import { DeleteEventModal } from "@/src/components/agenda/DeleteEventModal";
import { DetailsSidebar } from "@/src/components/agenda/DetailsSidebar";
import {
  AddResponsibilityModal,
  EditAssigneesModal,
  EventFormModal,
  EventFormValue,
} from "@/src/components/agenda/EventModals";
import { MiniCalendar, toIso } from "@/src/components/agenda/MiniCalendar";
import { RemoveAssignmentModal } from "@/src/components/agenda/RemoveAssignmentModal";
import { ResponsibilitiesPanel } from "@/src/components/agenda/ResponsibilitiesPanel";
import { Button, PageHeader, Spinner } from "@/src/components/common";
import { useAuth } from "@/src/contexts/AuthContext";
import { useAgendaNotifications } from "@/src/hooks/useAgendaNotifications";
import { useI18n } from "@/src/lib/i18n";
import { useCan } from "@/src/lib/permissions/client";
import { Can } from "@/src/lib/permissions/components";
import type {
  AgendaEvent,
  Assignee,
  ResponsibilityCategory,
} from "@/src/types";
import { formatLongDate } from "@/src/utils/agendaDate";
import {
  assigneeKey,
  collectEventMembers,
  groupAssignees,
} from "@/src/utils/agendaNotify";
import { CalendarPlus, Printer, Trash2 } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { usePrint } from "../contexts/PrintContext";
import { useAgenda } from "../hooks/useAgenda";

/** A removal waiting for the confirm-with-notify-toggle dialog. */
type PendingRemoval =
  | { kind: "responsibility"; eventId: string; respId: string }
  | {
      kind: "assignees";
      eventId: string;
      respId: string;
      next: Assignee[];
      removed: Assignee[];
    };

export const AgendaPage: React.FC = () => {
  const { t } = useI18n();
  const { organization } = useAuth();
  const store = useAgenda();
  const { printEvent, printEvents } = usePrint();
  const [searchParams, setSearchParams] = useSearchParams();
  const { granted: canCreateAgenda } = useCan("agenda.create");
  const { granted: canUpdateAgenda } = useCan("agenda.update");
  const { granted: canDeleteAgenda } = useCan("agenda.delete");

  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => toIso(new Date()));
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const [isNewEventOpen, setIsNewEventOpen] = useState(false);
  const [isEditEventOpen, setIsEditEventOpen] = useState(false);
  const [isAddResponsibilityOpen, setIsAddResponsibilityOpen] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<PendingRemoval | null>(
    null,
  );
  const [isRemoving, setIsRemoving] = useState(false);
  const [editingAssigneesFor, setEditingAssigneesFor] = useState<string | null>(
    null,
  );
  /** Snapshot kept open while delete + optional notify finish. */
  const [pendingDeleteEvent, setPendingDeleteEvent] =
    useState<AgendaEvent | null>(null);

  // Open create modal when navigated here with ?create=1 (e.g. from command palette)
  useEffect(() => {
    if (searchParams.get("create") === "1" && canCreateAgenda) {
      setIsNewEventOpen(true);
      setSearchParams(
        (prev) => {
          prev.delete("create");
          return prev;
        },
        { replace: true },
      );
    }
  }, [searchParams, setSearchParams, canCreateAgenda]);

  const markedDates = useMemo(
    () => new Set(store.events.map((ev) => ev.date)),
    [store.events],
  );

  const eventsForSelectedDate = useMemo(
    () => store.getEventsForDate(selectedDate),
    [store, selectedDate],
  );

  // Keep a valid selection whenever the day or the underlying data changes.
  const effectiveEventId = useMemo(() => {
    if (
      selectedEventId &&
      eventsForSelectedDate.some((ev) => ev.id === selectedEventId)
    ) {
      return selectedEventId;
    }
    return eventsForSelectedDate[0]?.id ?? null;
  }, [selectedEventId, eventsForSelectedDate]);

  const selectedEvent = useMemo(
    () => store.events.find((ev) => ev.id === effectiveEventId),
    [store.events, effectiveEventId],
  );

  const responsibilitiesForSelectedEvent = useMemo(
    () =>
      effectiveEventId
        ? store.getResponsibilitiesForEvent(effectiveEventId)
        : [],
    [store, effectiveEventId],
  );

  const responsibilityCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const ev of store.events) {
      counts[ev.id] = ev.responsibilities.length;
    }
    return counts;
  }, [store.events]);

  const categoriesById = useMemo(() => {
    const map: Record<string, ResponsibilityCategory> = {};
    for (const c of store.categories) map[c.id] = c;
    return map;
  }, [store.categories]);

  const reachableMemberIds = useMemo(() => {
    const set = new Set<string>();
    for (const member of organization?.members ?? []) {
      if (member.userId) set.add(member.id);
    }
    return set;
  }, [organization?.members]);

  const isReachable = useCallback(
    (memberId: string) => reachableMemberIds.has(memberId),
    [reachableMemberIds],
  );

  // Studio-side notification flows (assignments / date / location).
  const notifications = useAgendaNotifications({
    event: selectedEvent,
    store,
    categoriesById,
  });

  const deleteAffectedCount = useMemo(
    () =>
      pendingDeleteEvent
        ? collectEventMembers(pendingDeleteEvent, isReachable).length
        : 0,
    [pendingDeleteEvent, isReachable],
  );

  // What the pending removal dialog is about to delete (null → hidden).
  const removalInfo = useMemo(() => {
    if (!pendingRemoval) return null;
    const target = store.events.find((e) => e.id === pendingRemoval.eventId);
    const responsibility = target?.responsibilities.find(
      (r) => r.id === pendingRemoval.respId,
    );
    const label = responsibility
      ? (categoriesById[responsibility.categoryId]?.label ??
        t("agenda.responsibility"))
      : t("agenda.responsibility");
    return pendingRemoval.kind === "responsibility"
      ? {
          title: t("agenda.removeResponsibility"),
          summary: label,
          count: responsibility?.assignees.length ?? 0,
        }
      : {
          title: t("agenda.notify.removeAssigneesTitle"),
          summary: pendingRemoval.removed.map((a) => a.name).join(", "),
          count: pendingRemoval.removed.length,
        };
  }, [pendingRemoval, store.events, categoriesById, t]);

  const handleConfirmRemoval = async (notifyUser: boolean) => {
    if (!pendingRemoval || !removalInfo) return;
    const { eventId, respId } = pendingRemoval;
    const target = store.events.find((e) => e.id === eventId);
    const responsibility = target?.responsibilities.find(
      (r) => r.id === respId,
    );
    const label = responsibility
      ? (categoriesById[responsibility.categoryId]?.label ??
        t("agenda.responsibility"))
      : t("agenda.responsibility");

    setIsRemoving(true);
    try {
      if (pendingRemoval.kind === "responsibility") {
        const affected = responsibility
          ? groupAssignees(responsibility.assignees, label, isReachable)
          : [];
        // Remove first — never leave an assignment behind after promising a
        // cancellation notice.
        await store.removeResponsibility(eventId, respId);
        if (notifyUser && affected.length > 0) {
          await notifications.notifyRemoval(affected);
        }
      } else {
        const affected = groupAssignees(
          pendingRemoval.removed,
          label,
          isReachable,
        );
        await store.updateResponsibilityAssignees(
          eventId,
          respId,
          pendingRemoval.next,
        );
        if (notifyUser && affected.length > 0) {
          await notifications.notifyRemoval(affected);
        }
      }
    } catch {
      // error toast already shown by the store
    } finally {
      setIsRemoving(false);
      setPendingRemoval(null);
    }
  };

  const handleConfirmDeleteEvent = async (notifyUsers: boolean) => {
    if (!pendingDeleteEvent) return;
    const snapshot = pendingDeleteEvent;
    const groups = collectEventMembers(snapshot, isReachable).map(
      (memberId) => ({ memberId, labels: [] as string[] }),
    );

    try {
      // Capture recipients first, then delete — the cancel notice needs the
      // event snapshot after the row is gone from the store.
      await store.deleteEvent(snapshot.id);
      if (notifyUsers && groups.length > 0) {
        await notifications.notifyEventCancelled(snapshot, groups);
      }
      setSelectedEventId(null);
      setPendingDeleteEvent(null);
    } catch {
      // error toast already shown by the store
    }
  };

  // The responsibility being edited, plus the event it lives in (needed to
  // persist assignee changes since responsibilities are embedded in events).
  const editingAssigneesResp = useMemo(() => {
    if (!editingAssigneesFor) return null;
    for (const ev of store.events) {
      const r = ev.responsibilities.find((x) => x.id === editingAssigneesFor);
      if (r) return { eventId: ev.id, responsibility: r };
    }
    return null;
  }, [store.events, editingAssigneesFor]);

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    setSelectedEventId(null);
  };

  const handleCreateEvent = async (value: EventFormValue) => {
    const id = await store.addEvent(value);
    setSelectedDate(value.date);
    setSelectedEventId(id);
    setIsNewEventOpen(false);
  };

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-m3-bg dark:bg-m3-bg">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title={t("common.agenda")}
          description={t("agenda.subtitle")}
          actions={
            <>
              {selectedEvent ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={<Printer className="w-4 h-4" />}
                  onClick={() => {
                    printEvent(selectedEvent, store.categories);
                  }}
                  title={t("print.buttons.printEventTitle")}
                >
                  <span className="hidden sm:inline">
                    {t("print.buttons.printEvent")}
                  </span>
                </Button>
              ) : eventsForSelectedDate.length > 0 ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={<Printer className="w-4 h-4" />}
                  onClick={() => {
                    printEvents(
                      eventsForSelectedDate,
                      store.categories,
                      t("agenda.printDayAgenda", {
                        date: formatLongDate(selectedDate, t),
                      }),
                    );
                  }}
                  title={t("print.buttons.printDayTitle")}
                >
                  <span className="hidden sm:inline">
                    {t("print.buttons.printDay", {
                      count: eventsForSelectedDate.length,
                    })}
                  </span>
                </Button>
              ) : null}

              {selectedEvent && (
                <Can permission="agenda.delete">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 className="w-4 h-4" />}
                    onClick={() => setPendingDeleteEvent(selectedEvent)}
                    className="text-m3-danger hover:text-m3-danger hover:bg-m3-danger/10"
                  >
                    {t("agenda.deleteEvent")}
                  </Button>
                </Can>
              )}

              <Can permission="agenda.create">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  icon={<CalendarPlus className="w-4 h-4" />}
                  onClick={() => setIsNewEventOpen(true)}
                >
                  {t("agenda.newEvent")}
                </Button>
              </Can>
            </>
          }
        />

        {store.isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Spinner label={t("common.loading")} />
          </div>
        ) : (
          /* Body: calendar / events / details */
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_280px] gap-5 items-start">
            <div className="space-y-4">
              <MiniCalendar
                visibleMonth={visibleMonth}
                selectedDate={selectedDate}
                markedDates={markedDates}
                onSelectDate={handleSelectDate}
                onChangeMonth={(delta) =>
                  setVisibleMonth(
                    (prev) =>
                      new Date(prev.getFullYear(), prev.getMonth() + delta, 1),
                  )
                }
                onGoToday={() => {
                  const iso = toIso(new Date());
                  setVisibleMonth(new Date());
                  handleSelectDate(iso);
                }}
              />
              <DayAgendaList
                events={eventsForSelectedDate}
                selectedEventId={effectiveEventId}
                responsibilityCounts={responsibilityCounts}
                onSelectEvent={setSelectedEventId}
              />
            </div>

            <ResponsibilitiesPanel
              event={selectedEvent}
              responsibilities={responsibilitiesForSelectedEvent}
              categories={categoriesById}
              canUpdate={canUpdateAgenda}
              onAddResponsibility={() => setIsAddResponsibilityOpen(true)}
              onEditAssignees={(respId) => setEditingAssigneesFor(respId)}
              onRemoveResponsibility={(respId) => {
                if (selectedEvent) {
                  setPendingRemoval({
                    kind: "responsibility",
                    eventId: selectedEvent.id,
                    respId,
                  });
                }
              }}
            />

            <DetailsSidebar
              event={selectedEvent}
              onEdit={() => setIsEditEventOpen(true)}
              canUpdate={canUpdateAgenda}
              canNotify={notifications.canNotify}
              unnotifiedCount={notifications.unnotifiedCount}
              pendingDate={notifications.pendingDate}
              pendingLocation={notifications.pendingLocation}
              isNotifying={notifications.isNotifying}
              onNotifyAssignments={() => void notifications.notifyAssignments()}
              onNotifyUpdate={() => void notifications.notifyUpdate()}
            />
          </div>
        )}
      </div>

      {/* Create event */}
      <EventFormModal
        isOpen={isNewEventOpen}
        onClose={() => setIsNewEventOpen(false)}
        onSubmit={handleCreateEvent}
        title={t("agenda.newEvent")}
        submitLabel={t("agenda.createEvent")}
        initial={{ date: selectedDate }}
      />

      {/* Edit event (title / type / date-time / duration / linked service /
          location / notes) */}
      {selectedEvent && (
        <EventFormModal
          isOpen={isEditEventOpen}
          onClose={() => setIsEditEventOpen(false)}
          onSubmit={(value) => {
            store.updateEvent(selectedEvent.id, value);
            // The edit is saved first; notifying stays an explicit action.
            // Track what changed so the "notify" buttons know what to send
            // (date+location together → one aggregated update).
            const changes: { date?: boolean; location?: boolean } = {};
            if (
              value.date !== selectedEvent.date ||
              value.time !== selectedEvent.time
            ) {
              changes.date = true;
            }
            if (
              (value.location ?? "").trim() !==
              (selectedEvent.location ?? "").trim()
            ) {
              changes.location = true;
            }
            if (changes.date || changes.location) {
              notifications.markChanged(selectedEvent.id, changes);
            }
            setSelectedDate(value.date);
            setIsEditEventOpen(false);
          }}
          onDelete={
            canDeleteAgenda
              ? () => {
                  setIsEditEventOpen(false);
                  setPendingDeleteEvent(selectedEvent);
                }
              : undefined
          }
          title={t("agenda.editEvent")}
          submitLabel={t("common.save")}
          initial={selectedEvent as EventFormValue}
        />
      )}

      {/* Add responsibility */}
      {selectedEvent && (
        <AddResponsibilityModal
          isOpen={isAddResponsibilityOpen}
          onClose={() => setIsAddResponsibilityOpen(false)}
          categories={store.categories}
          existingCategoryIds={responsibilitiesForSelectedEvent.map(
            (r) => r.categoryId,
          )}
          manualSuggestions={store.manualAssignees}
          onSubmit={async (categoryId, assignees) => {
            try {
              // Await the save so a failure keeps the modal open (the hook
              // shows the error toast) instead of closing it silently.
              await store.addResponsibility(
                selectedEvent.id,
                categoryId,
                assignees,
              );
              setIsAddResponsibilityOpen(false);
            } catch {
              // error toast already shown by the hook; keep the modal open
            }
          }}
        />
      )}

      {/* Edit assignees of one responsibility */}
      {editingAssigneesResp && (
        <EditAssigneesModal
          isOpen={!!editingAssigneesFor}
          onClose={() => setEditingAssigneesFor(null)}
          categoryLabel={
            categoriesById[editingAssigneesResp.responsibility.categoryId]
              ?.label ?? ""
          }
          assignees={editingAssigneesResp.responsibility.assignees}
          manualSuggestions={store.manualAssignees}
          onSubmit={async (assignees) => {
            const previous = editingAssigneesResp.responsibility.assignees;
            const removed = previous.filter(
              (p) => !assignees.some((a) => assigneeKey(a) === assigneeKey(p)),
            );
            if (removed.length > 0) {
              // Removals go through the confirm flow with the optional
              // "notify about the cancellation" toggle.
              setEditingAssigneesFor(null);
              setPendingRemoval({
                kind: "assignees",
                eventId: editingAssigneesResp.eventId,
                respId: editingAssigneesResp.responsibility.id,
                next: assignees,
                removed,
              });
              return;
            }
            try {
              // Await the save so a failure keeps the modal open.
              await store.updateResponsibilityAssignees(
                editingAssigneesResp.eventId,
                editingAssigneesResp.responsibility.id,
                assignees,
              );
              setEditingAssigneesFor(null);
            } catch {
              // error toast already shown by the hook; keep the modal open
            }
          }}
        />
      )}

      {/* Remove assignment(s) — optional cancellation notice */}
      {pendingRemoval && removalInfo && (
        <RemoveAssignmentModal
          isOpen
          onClose={() => setPendingRemoval(null)}
          title={removalInfo.title}
          summary={removalInfo.summary}
          affectedCount={removalInfo.count}
          isBusy={isRemoving}
          onConfirm={handleConfirmRemoval}
        />
      )}

      {pendingDeleteEvent && (
        <DeleteEventModal
          isOpen
          onClose={() => setPendingDeleteEvent(null)}
          eventTitle={pendingDeleteEvent.title}
          affectedCount={deleteAffectedCount}
          canNotify={notifications.canNotify}
          isBusy={store.isDeleting || notifications.isNotifying}
          onConfirm={handleConfirmDeleteEvent}
        />
      )}
    </div>
  );
};

export default AgendaPage;
