/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Modal } from "@/src/components/common";
import { useI18n } from "@/src/lib/i18n";
import { Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { NotifyToggle } from "./NotifyToggle";

interface RemoveAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Modal title — differs for "remove responsibility" vs "remove assignees". */
  title: string;
  /** What is about to go away, e.g. "Guitarra" or "Rita, João". */
  summary: string;
  /** How many assignment entries are affected (drives the plural copy). */
  affectedCount: number;
  /** `notify` is the state of the cancellation toggle (OFF by default). */
  onConfirm: (notify: boolean) => void | Promise<void>;
  isBusy?: boolean;
}

/**
 * Delete-confirmation flow for assignment removals, with the optional
 * "notify about the cancellation" toggle. OFF (default) → assignment removed
 * only; ON → a single aggregated `assignment_removed` notification goes out.
 */
export const RemoveAssignmentModal: React.FC<RemoveAssignmentModalProps> = ({
  isOpen,
  onClose,
  title,
  summary,
  affectedCount,
  onConfirm,
  isBusy = false,
}) => {
  const { t, tc } = useI18n();
  const [notify, setNotify] = useState(false);

  useEffect(() => {
    if (isOpen) setNotify(false);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4 pt-2">
        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300">
          <Trash2 className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
          <span>{tc("agenda.notify.removeAffected", affectedCount)}</span>
        </div>

        {summary && (
          <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
              {t("agenda.notify.removeSummary")}
            </p>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
              {summary}
            </p>
          </div>
        )}

        <NotifyToggle
          checked={notify}
          onChange={setNotify}
          label={t("agenda.notify.notifyRemovalLabel")}
          hint={t("agenda.notify.notifyRemovalHint")}
          disabled={isBusy}
        />

        <div className="flex justify-end gap-2 pt-2 border-t border-m3-border/40">
          <Button variant="outline" onClick={onClose} disabled={isBusy}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="danger"
            isLoading={isBusy}
            onClick={() => void onConfirm(notify)}
            icon={<Trash2 className="w-4 h-4" />}
          >
            {t("common.delete")}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
