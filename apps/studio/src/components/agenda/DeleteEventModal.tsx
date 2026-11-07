/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Modal } from "@/src/components/common";
import { useI18n } from "@/src/lib/i18n";
import { AlertTriangle, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { NotifyToggle } from "./NotifyToggle";

interface DeleteEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventTitle: string;
  /** How many reachable assignees would receive a cancellation notice. */
  affectedCount: number;
  canNotify: boolean;
  isBusy?: boolean;
  onConfirm: (notify: boolean) => void | Promise<void>;
}

/**
 * Confirm event deletion with an optional "notify all assigned users" toggle
 * (OFF by default).
 */
export const DeleteEventModal: React.FC<DeleteEventModalProps> = ({
  isOpen,
  onClose,
  eventTitle,
  affectedCount,
  canNotify,
  isBusy = false,
  onConfirm,
}) => {
  const { t, tc } = useI18n();
  const [notify, setNotify] = useState(false);

  useEffect(() => {
    if (isOpen) setNotify(false);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t("agenda.deleteEvent")}>
      <div className="space-y-4 pt-2">
        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
          <span>{t("agenda.deleteEventConfirmBody")}</span>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
            {t("agenda.eventTitle")}
          </p>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed truncate">
            {eventTitle}
          </p>
        </div>

        {canNotify && affectedCount > 0 && (
          <NotifyToggle
            checked={notify}
            onChange={setNotify}
            label={t("agenda.notify.notifyDeleteLabel")}
            hint={tc("agenda.notify.notifyDeleteHint", affectedCount)}
            disabled={isBusy}
          />
        )}

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
            {t("agenda.deleteEvent")}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
