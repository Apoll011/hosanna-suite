/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useI18n } from "@/src/lib/i18n";
import { AgendaEvent } from "@/src/types";
import { Users } from "lucide-react";
import React from "react";

interface DayAgendaListProps {
  events: AgendaEvent[];
  selectedEventId: string | null;
  responsibilityCounts: Record<string, number>;
  onSelectEvent: (id: string) => void;
}

export const DayAgendaList: React.FC<DayAgendaListProps> = ({
  events,
  selectedEventId,
  responsibilityCounts,
  onSelectEvent,
}) => {
  const { t } = useI18n();

  return (
    <div className="bg-m3-card border border-m3-border rounded-[var(--radius-xl)] p-4 shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-label">{t("agenda.dayEvents")}</h3>
        <span className="text-caption bg-m3-sidebar/60 rounded-full px-2 py-0.5">
          {events.length}
        </span>
      </div>

      {events.length === 0 ? (
        <p className="text-xs text-m3-secondary py-4 text-center">
          {t("agenda.noEventsForDay")}
        </p>
      ) : (
        <div className="space-y-2">
          {events.map((event) => {
            const isSelected = event.id === selectedEventId;
            const count = responsibilityCounts[event.id] ?? 0;
            return (
              <button
                key={event.id}
                onClick={() => onSelectEvent(event.id)}
                className={`w-full text-left rounded-[var(--radius-md)] p-3 border transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                  isSelected
                    ? "bg-m3-primary/10 border-m3-primary/20"
                    : "border-transparent hover:bg-m3-hover"
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-m3-text">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? "bg-m3-primary" : "bg-m3-border"
                      }`}
                    />
                    {event.time}
                    <span className="font-bold truncate">{event.title}</span>
                  </div>
                  <p className="text-[11px] text-m3-secondary mt-0.5 truncate">
                    {event.type}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-m3-secondary shrink-0">
                  <Users className="w-3.5 h-3.5" />
                  {count}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
