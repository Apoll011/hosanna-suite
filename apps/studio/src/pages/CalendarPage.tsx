import { EventFormModal, type EventFormValue } from "@/src/components/agenda/EventModals";
import { useAgenda } from "@/src/hooks/useAgenda";
import { useI18n } from "@/src/lib/i18n";
import type { AgendaEvent } from "@/src/types";
import { Calendar } from "@hosanna/calendar";
import { Button, PageHeader, Spinner } from "@hosanna/ui";
import { Can } from "@hosanna/ui/permissions";
import { Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";

export function CalendarPage() {
  const { t } = useI18n();
  const store = useAgenda();
  const [isNewEventOpen, setIsNewEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null);
  const [isEditEventOpen, setIsEditEventOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));

  const handleCreate = async (value: EventFormValue) => {
    await store.addEvent(value);
    setSelectedDate(value.date);
    setIsNewEventOpen(false);
  };

  const handleUpdate = (event: AgendaEvent, patch: Partial<AgendaEvent>) => {
    void store.updateEvent(event.id, patch);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto bg-m3-bg px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5">
        <PageHeader
          title={t("common.agenda")}
          description={t("agenda.subtitle")}
          actions={
            <Can permission="agenda.create">
              <Button
                type="button"
                size="sm"
                icon={<CalendarIcon className="size-4" />}
                onClick={() => setIsNewEventOpen(true)}
              >
                {t("agenda.newEvent")}
              </Button>
            </Can>
          }
        />

        <section className="min-h-[680px] overflow-hidden rounded-lg border border-m3-border bg-m3-card">
          {store.isLoading ? (
            <div className="flex min-h-[680px] items-center justify-center">
              <Spinner label={t("common.loading")} />
            </div>
          ) : (
            <Calendar
              events={store.events}
              defaultView="month"
              onEventCreate={() => setIsNewEventOpen(true)}
              onEventUpdate={handleUpdate}
              onEventClick={(event) => {
                setSelectedEvent(event);
                setSelectedDate(event.date);
                setIsEditEventOpen(true);
              }}
              className="overflow-hidden bg-m3-card"
            />
          )}
        </section>
      </div>

      {selectedEvent && (
        <EventFormModal
          isOpen={isEditEventOpen}
          onClose={() => setIsEditEventOpen(false)}
          onSubmit={(value) => {
            void store.updateEvent(selectedEvent.id, value);
            setIsEditEventOpen(false);
          }}
          title={t("agenda.editEvent")}
          submitLabel={t("common.edit")}
          initial={selectedEvent}
        />
      )}

      <EventFormModal
        isOpen={isNewEventOpen}
        onClose={() => setIsNewEventOpen(false)}
        onSubmit={(value) => void handleCreate(value)}
        title={t("agenda.newEvent")}
        submitLabel={t("agenda.createEvent")}
        initial={{ date: selectedDate }}
      />
    </div>
  );
}
