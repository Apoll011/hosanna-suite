/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useI18n } from "@/src/lib/i18n";
import { Responsibility, ResponsibilityCategory } from "@/src/types";
import { COLOR_MAP, ICON_MAP } from "@/src/utils/iconMap";
import { MoreVertical, Trash2, UserPlus } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { AvatarStack } from "./AvatarStack";

interface ResponsibilityRowProps {
  responsibility: Responsibility;
  category: ResponsibilityCategory | undefined;
  canUpdate?: boolean;
  onEditAssignees: () => void;
  onRemove: () => void;
}

export const ResponsibilityRow: React.FC<ResponsibilityRowProps> = ({
  responsibility,
  category,
  canUpdate = true,
  onEditAssignees,
  onRemove,
}) => {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const Icon = ICON_MAP[category?.icon ?? "custom"];
  const colors = COLOR_MAP[category?.color ?? "slate"];

  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-m3-border/40 last:border-b-0">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${colors.bg} ${colors.text}`}
        >
          <Icon className="w-4.5 h-4.5" />
        </div>
        <span className="text-[13px] font-bold text-slate-900 dark:text-slate-100 truncate">
          {category?.label ?? t("agenda.responsibility")}
        </span>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {canUpdate ? (
          <button
            onClick={onEditAssignees}
            className="cursor-pointer"
            title={t("agenda.editAssignments")}
          >
            <AvatarStack assignees={responsibility.assignees} />
          </button>
        ) : (
          <AvatarStack assignees={responsibility.assignees} />
        )}

        {canUpdate && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="inline-flex items-center justify-center min-h-10 min-w-10 rounded-[var(--radius-md)] text-m3-secondary hover:text-m3-text hover:bg-m3-hover transition-colors cursor-pointer"
              title={t("agenda.moreOptions")}
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-900 border border-m3-border rounded-xl shadow-xl z-20 p-1.5 space-y-0.5">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onEditAssignees();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-m3-hover rounded-lg transition-colors cursor-pointer text-left"
                >
                  <UserPlus className="w-3.5 h-3.5 text-m3-primary" />
                  {t("agenda.editAssignments")}
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onRemove();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer text-left"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {t("agenda.removeResponsibility")}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
