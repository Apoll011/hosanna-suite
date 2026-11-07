// ══════════════════════════════════════════════════════════════════════
// ── Message Modal ─────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════

import { Button, Modal } from "@/src/components/common";
import {
  DurationField,
  durationInputToSeconds,
  secondsToDurationInput,
} from "@/src/components/DurationField";
import { useI18n } from "@/src/lib/i18n";
import { MessageSquare } from "lucide-react";
import React, { useEffect, useState } from "react";

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    content: string;
    notes: string;
    duration: number;
  }) => void;
  initial?: {
    title: string;
    content: string;
    notes: string;
    duration?: number;
  };
}

export const MessageModal: React.FC<MessageModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initial,
}) => {
  const { t } = useI18n();
  const defaultTitle = t("serviceModals.message.modalTitle");

  const [title, setTitle] = useState(initial?.title || defaultTitle);
  const [content, setContent] = useState(initial?.content || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [duration, setDuration] = useState(
    secondsToDurationInput(initial?.duration),
  );

  // Snapshot form fields only when the modal opens — do not depend on
  // `initial` identity, or parent re-renders reset in-progress edits.
  useEffect(() => {
    if (!isOpen) return;
    setTitle(initial?.title?.trim() ? initial.title : defaultTitle);
    setContent(initial?.content || "");
    setNotes(initial?.notes || "");
    setDuration(secondsToDurationInput(initial?.duration));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset on open only
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("serviceModals.message.modalTitle")}
    >
      <div className="space-y-4 py-2">
        <div
          className="flex items-center gap-3 p-3 rounded-xl"
          style={{ backgroundColor: "#FEF3C7" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#D97706", color: "white" }}
          >
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold" style={{ color: "#D97706" }}>
              {t("serviceModals.message.badgeTitle")}
            </p>
            <p className="text-[11px] text-slate-500">
              {t("serviceModals.message.badgeDesc")}
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            {t("serviceModals.message.titleLabel")}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("serviceModals.message.titlePlaceholder")}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            {t("serviceModals.message.summaryLabel")}
            <span className="font-normal text-slate-400 ml-1">
              ({t("common.details")})
            </span>
          </label>
          <textarea
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t("serviceModals.message.summaryPlaceholder")}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            {t("serviceModals.message.notesLabel")}
            <span className="font-normal text-slate-400 ml-1">
              ({t("common.details")})
            </span>
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("serviceModals.message.notesPlaceholder")}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <DurationField
          value={duration}
          onChange={setDuration}
          accentRingClass="focus:ring-amber-500/40"
          badgeClass="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-200/50 dark:border-amber-800/50"
          presets={[
            { label: "30:00", sec: 1800 },
            { label: "40:00", sec: 2400 },
            { label: "45:00", sec: 2700 },
            { label: "60:00", sec: 3600 },
          ]}
        />

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => {
              if (!title.trim()) return;
              onSave({
                title,
                content,
                notes,
                duration: durationInputToSeconds(duration),
              });
            }}
          >
            {t("common.save")}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
