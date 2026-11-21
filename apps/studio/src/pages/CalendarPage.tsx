/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Calendar, EventFormModal, type EventFormValue, type IUser } from "@hosanna/calendar";
import "@hosanna/calendar/styles.css";
import { PageHeader, Spinner, useCan, Can, Button } from "@hosanna/ui";
import { CalendarPlus, Printer, Trash2 } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";

import { DeleteEventModal } from "@/src/components/agenda/DeleteEventModal";
import {
  AddResponsibilityModal,
  EditAssigneesModal,
} from "@/src/components/agenda/EventModals";
import { RemoveAssignmentModal } from "@/src/components/agenda/RemoveAssignmentModal";
import { useAuth } from "@/src/contexts/AuthContext";
import { usePrint } from "@/src/contexts/PrintContext";
import { useAgenda } from "@/src/hooks/useAgenda";
import { useAgendaNotifications } from "@/src/hooks/useAgendaNotifications";
import { useAppNavigate } from "@/src/hooks/useAppNavigate";
import { useServices } from "@/src/hooks/useServices";
import { useI18n } from "@/src/lib/i18n";
import type { AgendaEvent, Assignee, ResponsibilityCategory } from "@/src/types";
import { formatLongDate } from "@/src/utils/agendaDate";
import { assigneeKey, collectEventMembers, groupAssignees } from "@/src/utils/agendaNotify";

type PendingRemoval =
  | { kind: "responsibility"; eventId: string; respId: string }
  | {
      kind: "assignees";
      eventId: string;
      respId: string;
      next: Assignee[];
      removed: Assignee[];
    };

export function CalendarPage() {
  const { t } = useI18n();
  const { organization } = useAuth();
  const { navigate } = useAppNavigate();
  const { servicesQuery } = useServices();
  const store = useAgenda();
  const { printEvent, printEvents } = usePrint();
  const { granted: canCreateAgenda } = useCan("agenda.create");
  const { granted: canUpdateAgenda } = useCan("agenda.update");
  const { granted: canDeleteAgenda } = useCan("agenda.delete");
  const slugPrefix = organization?.slug ? `/${organization.slug}` : "";

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isNewEventOpen, setIsNewEventOpen] = useState(false);
  const [isEditEventOpen, setIsEditEventOpen] = useState(false);
  const [eventFormInitial, setEventFormInitial] = useState<Partial<EventFormValue>>({});
  const [isAddResponsibilityOpen, setIsAddResponsibilityOpen] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<PendingRemoval | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [editingAssigneesFor, setEditingAssigneesFor] = useState<string | null>(null);
  const [pendingDeleteEvent, setPendingDeleteEvent] = useState<AgendaEvent | null>(null);

  const selectedEvent = useMemo(
    () => store.events.find((ev) => ev.id === selectedEventId) ?? null,
    [store.events, selectedEventId]
  );

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
    [reachableMemberIds]
  );

  const memberUsers: IUser[] = useMemo(() => {
    return (organization?.members ?? []).map((m) => ({
      id: m.id,
      name: m.user?.name || m.id,
      picturePath: m.user?.image ?? null,
      avatarUrl: m.user?.image ?? null,
    }));
  }, [organization?.members]);

  const notifications = useAgendaNotifications({
    event: selectedEvent ?? undefined,
    store,
    categoriesById,
  });

  const deleteAffectedCount = useMemo(
    () => (pendingDeleteEvent ? collectEventMembers(pendingDeleteEvent, isReachable).length : 0),
    [pendingDeleteEvent, isReachable]
  );

  const removalInfo = useMemo(() => {
    if (!pendingRemoval) return null;
    const target = store.events.find((e) => e.id === pendingRemoval.eventId);
    const responsibility = target?.responsibilities.find((r) => r.id === pendingRemoval.respId);
    const label = responsibility
      ? (categoriesById[responsibility.categoryId]?.label ?? t("agenda.responsibility"))
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
    const responsibility = target?.responsibilities.find((r) => r.id === respId);
    const label = responsibility
      ? (categoriesById[responsibility.categoryId]?.label ?? t("agenda.responsibility"))
      : t("agenda.responsibility");

    setIsRemoving(true);
    try {
      if (pendingRemoval.kind === "responsibility") {
        const affected = responsibility
          ? groupAssignees(responsibility.assignees, label, isReachable)
          : [];
        await store.removeResponsibility(eventId, respId);
        if (notifyUser && affected.length > 0) {
          await notifications.notifyRemoval(affected);
        }
      } else {
        const affected = groupAssignees(pendingRemoval.removed, label, isReachable);
        await store.updateResponsibilityAssignees(eventId, respId, pendingRemoval.next);
        if (notifyUser && affected.length > 0) {
          await notifications.notifyRemoval(affected);
        }
      }
      setPendingRemoval(null);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleConfirmDelete = async (notifyUsers: boolean) => {
    if (!pendingDeleteEvent) return;
    const snapshot = pendingDeleteEvent;
    const members = collectEventMembers(snapshot, isReachable);
    const groups = members.map((memberId) => ({
      memberId,
      labels: [] as string[],
    }));

    try {
      await store.deleteEvent(snapshot.id);
      if (notifyUsers && groups.length > 0) {
        await notifications.notifyEventCancelled(snapshot, groups);
      }
      setSelectedEventId(null);
      setPendingDeleteEvent(null);
    } catch {}
  };

  const editingAssigneesResp = useMemo(() => {
    if (!editingAssigneesFor) return null;
    for (const ev of store.events) {
      const r = ev.responsibilities.find((x) => x.id === editingAssigneesFor);
      if (r) return { eventId: ev.id, responsibility: r };
    }
    return null;
  }, [store.events, editingAssigneesFor]);

  const handleCreateEvent = async (value: EventFormValue) => {
    const id = await store.addEvent(value);
    setSelectedEventId(id);
    setIsNewEventOpen(false);
  };

  const handleUpdateEvent = async (event: AgendaEvent) => {
    await store.updateEvent(event.id, event);
  };

  const handleDeleteEvent = (event: AgendaEvent) => {
    setPendingDeleteEvent(event);
  };

  const responsibilitiesForSelectedEvent = useMemo(
    () => (selectedEventId ? store.getResponsibilitiesForEvent(selectedEventId) : []),
    [store, selectedEventId]
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto bg-m3-bg px-4 py-5 sm:px-6 lg:px-8">
      <div className="flex w-full flex-col gap-5">
        <PageHeader
          title="Calendar"
          description={t("agenda.subtitle")}
          actions={
            <>
              {selectedEvent && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={<Printer className="w-4 h-4" />}
                  onClick={() => printEvent(selectedEvent, store.categories)}
                  title={t("print.buttons.printEventTitle")}
                >
                  <span className="hidden sm:inline">{t("print.buttons.printEvent")}</span>
                </Button>
              )}

              {selectedEvent && canDeleteAgenda && (
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
              )}

              <Can permission="agenda.create">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  icon={<CalendarPlus className="w-4 h-4" />}
                  onClick={() => {
                    setEventFormInitial({});
                    setIsNewEventOpen(true);
                  }}
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
          <section className="overflow-hidden rounded-lg border border-m3-border bg-m3-card shadow-sm w-full">
            <Calendar
              events={store.events}
              categories={store.categories}
              users={memberUsers}
              services={servicesQuery.data ?? []}
              defaultView="month"
              workingHours={null}
              canCreate={canCreateAgenda}
              canUpdate={canUpdateAgenda}
              canDelete={canDeleteAgenda}
              onEventCreate={(ev) => store.addEvent(ev as unknown as EventFormValue)}
              onEventUpdate={handleUpdateEvent}
              onEventDelete={handleDeleteEvent}
              onEventSelect={(ev) => setSelectedEventId(ev?.id ?? null)}
              onOpenService={(serviceId) => navigate(`${slugPrefix}/services/${serviceId}`)}
              onRequestCreateEvent={(init) => {
                setEventFormInitial(init ?? {});
                setIsNewEventOpen(true);
              }}
              onRequestEditEvent={(event) => {
                setSelectedEventId(event.id);
                setIsEditEventOpen(true);
              }}
              onAddResponsibility={(eventId) => {
                setSelectedEventId(eventId);
                setIsAddResponsibilityOpen(true);
              }}
              onEditAssignees={(eventId, respId) => {
                setSelectedEventId(eventId);
                setEditingAssigneesFor(respId);
              }}
              onRemoveResponsibility={(eventId, respId) => {
                setPendingRemoval({
                  kind: "responsibility",
                  eventId,
                  respId,
                });
              }}
              onPrintEvent={(ev) => printEvent(ev as unknown as AgendaEvent, store.categories)}
            />
          </section>
        )}
      </div>

      <EventFormModal
        isOpen={isNewEventOpen}
        onClose={() => setIsNewEventOpen(false)}
        onSubmit={handleCreateEvent}
        title={t("agenda.newEvent")}
        submitLabel={t("agenda.createEvent")}
        services={servicesQuery.data ?? []}
        servicesLoading={servicesQuery.isLoading}
        initial={eventFormInitial}
      />

      {selectedEvent && (
        <EventFormModal
          isOpen={isEditEventOpen}
          onClose={() => setIsEditEventOpen(false)}
          onSubmit={(value) => {
            store.updateEvent(selectedEvent.id, value);
            const changes: { date?: boolean; location?: boolean } = {};
            if (value.date !== selectedEvent.date || value.time !== selectedEvent.time) {
              changes.date = true;
            }
            if ((value.location ?? "").trim() !== (selectedEvent.location ?? "").trim()) {
              changes.location = true;
            }
            if (changes.date || changes.location) {
              notifications.markChanged(selectedEvent.id, changes);
            }
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
          services={servicesQuery.data ?? []}
          servicesLoading={servicesQuery.isLoading}
          initial={selectedEvent as unknown as EventFormValue}
        />
      )}

      {selectedEvent && (
        <AddResponsibilityModal
          isOpen={isAddResponsibilityOpen}
          onClose={() => setIsAddResponsibilityOpen(false)}
          categories={store.categories}
          existingCategoryIds={responsibilitiesForSelectedEvent.map((r) => r.categoryId)}
          manualSuggestions={store.manualAssignees}
          onSubmit={async (categoryId, assignees) => {
            try {
              await store.addResponsibility(selectedEvent.id, categoryId, assignees);
              setIsAddResponsibilityOpen(false);
            } catch {}
          }}
        />
      )}

      {editingAssigneesResp && (
        <EditAssigneesModal
          isOpen={!!editingAssigneesFor}
          onClose={() => setEditingAssigneesFor(null)}
          categoryLabel={
            categoriesById[editingAssigneesResp.responsibility.categoryId]?.label ?? ""
          }
          assignees={editingAssigneesResp.responsibility.assignees}
          manualSuggestions={store.manualAssignees}
          onSubmit={async (assignees) => {
            const previous = editingAssigneesResp.responsibility.assignees;
            const removed = previous.filter(
              (p) => !assignees.some((a) => assigneeKey(a) === assigneeKey(p))
            );
            if (removed.length > 0) {
              setPendingRemoval({
                kind: "assignees",
                eventId: editingAssigneesResp.eventId,
                respId: editingAssigneesResp.responsibility.id,
                next: assignees,
                removed,
              });
              setEditingAssigneesFor(null);
              return;
            }
            try {
              await store.updateResponsibilityAssignees(
                editingAssigneesResp.eventId,
                editingAssigneesResp.responsibility.id,
                assignees
              );
              setEditingAssigneesFor(null);
            } catch {}
          }}
        />
      )}

      {pendingRemoval && removalInfo && (
        <RemoveAssignmentModal
          isOpen={!!pendingRemoval}
          onClose={() => setPendingRemoval(null)}
          onConfirm={handleConfirmRemoval}
          title={removalInfo.title}
          summary={removalInfo.summary}
          affectedCount={removalInfo.count}
          isBusy={isRemoving}
        />
      )}

      {pendingDeleteEvent && (
        <DeleteEventModal
          isOpen={!!pendingDeleteEvent}
          onClose={() => setPendingDeleteEvent(null)}
          onConfirm={handleConfirmDelete}
          eventTitle={pendingDeleteEvent.title}
          affectedCount={deleteAffectedCount}
          canNotify={notifications.canNotify}
        />
      )}
    </div>
  );
}
