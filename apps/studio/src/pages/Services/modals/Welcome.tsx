// ══════════════════════════════════════════════════════════════════════
// ── Welcome Modal ─────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════

import { Button, Modal } from "@/src/components/common";
import {
  DurationField,
  durationInputToSeconds,
  secondsToDurationInput,
} from "@/src/components/DurationField";
import { useI18n } from "@/src/lib/i18n";
import { FileText } from "lucide-react";
import React, { useEffect, useState } from "react";

interface WelcomeModalProps {
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

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initial,
}) => {
  const { t } = useI18n();
  const defaultTitle = t("serviceModals.welcome.defaultTitle");

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
      title={t("serviceModals.welcome.modalTitle")}
    >
      <div className="space-y-4 py-2">
        <div
          className="flex items-center gap-3 p-3 rounded-xl"
          style={{ backgroundColor: "#EBF5FF" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#1D4ED8", color: "white" }}
          >
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold" style={{ color: "#1D4ED8" }}>
              {t("serviceModals.welcome.badgeTitle")}
            </p>
            <p className="text-[11px] text-slate-500">
              {t("serviceModals.welcome.badgeDesc")}
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            {t("serviceModals.welcome.titleLabel")}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("serviceModals.welcome.titlePlaceholder")}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            {t("serviceModals.welcome.contentLabel")}
            <span className="font-normal text-slate-400 ml-1">
              ({t("common.details")})
            </span>
          </label>
          <textarea
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t("serviceModals.welcome.contentPlaceholder")}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            {t("serviceModals.welcome.notesLabel")}
            <span className="font-normal text-slate-400 ml-1">
              ({t("common.details")})
            </span>
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("serviceModals.welcome.notesPlaceholder")}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <DurationField
          value={duration}
          onChange={setDuration}
          accentRingClass="focus:ring-blue-500/40"
          badgeClass="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border-blue-200/50 dark:border-blue-800/50"
          presets={[
            { label: "2:00", sec: 120 },
            { label: "5:00", sec: 300 },
            { label: "10:00", sec: 600 },
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
