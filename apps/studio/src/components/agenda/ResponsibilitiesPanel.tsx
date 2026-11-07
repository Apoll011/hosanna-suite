/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useI18n } from "@/src/lib/i18n";
import { AgendaEvent, Responsibility } from "@/src/types";
import { ResponsibilityCategory } from "@/src/types";
import { Calendar, Plus } from "lucide-react";
import React from "react";
import { ResponsibilityRow } from "./ResponsibilityRow";

interface ResponsibilitiesPanelProps {
  event: AgendaEvent | undefined;
  responsibilities: Responsibility[];
  categories: Record<string, ResponsibilityCategory>;
  canUpdate?: boolean;
  onAddResponsibility: () => void;
  onEditAssignees: (responsibilityId: string) => void;
  onRemoveResponsibility: (responsibilityId: string) => void;
}

export const ResponsibilitiesPanel: React.FC<ResponsibilitiesPanelProps> = ({
  event,
  responsibilities,
  categories,
  canUpdate = true,
  onAddResponsibility,
  onEditAssignees,
  onRemoveResponsibility,
}) => {
  const { t } = useI18n();

  if (!event) {
    return (
      <div className="bg-m3-card border border-dashed border-m3-border rounded-[var(--radius-lg)] px-6 py-10 flex flex-col items-center justify-center text-center self-start">
        <Calendar className="w-10 h-10 text-m3-secondary mb-3" />
        <p className="text-sm font-bold text-m3-secondary">
          {t("agenda.selectEventToSeeDetails")}
        </p>
        <p className="text-xs text-m3-secondary mt-1">
          {t("agenda.pickDayHint")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-m3-card border border-m3-border rounded-[var(--radius-xl)] p-5 shadow-[var(--shadow-sm)]">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-title text-m3-text">
            {t("agenda.responsibilities")}
          </h3>
          {canUpdate && (
            <button
              onClick={onAddResponsibility}
              className="flex items-center gap-1.5 text-xs font-bold text-m3-primary bg-m3-primary/10 hover:bg-m3-primary/15 px-3 py-1.5 rounded-xl border border-m3-primary/20 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              {t("agenda.addResponsibility")}
            </button>
          )}
        </div>

        {responsibilities.length === 0 ? (
          <p className="text-xs text-m3-secondary py-6 text-center">
            {t("agenda.noResponsibilities")}
          </p>
        ) : (
          <div>
            {responsibilities.map((r) => (
              <ResponsibilityRow
                key={r.id}
                responsibility={r}
                category={categories[r.categoryId]}
                canUpdate={canUpdate}
                onEditAssignees={() => onEditAssignees(r.id)}
                onRemove={() => onRemoveResponsibility(r.id)}
              />
            ))}
          </div>
        )}

        <p className="text-[11px] text-m3-secondary mt-4 pt-3 border-t border-m3-border/40">
          {t("agenda.assigneesGetNotified")}
        </p>
      </div>
    </div>
  );
};
