// SPDX-License-Identifier: AGPL-3.0-only
import { Button, Input, Modal } from "@hosanna/ui";
import {
  Calendar,
  Clock,
  Clock3,
  FileText,
  Info,
  Layers,
  MapPin,
  Minus,
  Plus,
  Tag,
  Trash2,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import type { EventFormValue, Service } from "../../interfaces";
import type { TEventColor } from "../../types";
import { ServiceLinkField, serviceTotalMinutes } from "./service-link-field";

const SectionHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
  hint?: string;
}> = ({ icon, title, hint }) => (
  <div className="flex items-start gap-2.5">
    <div className="mt-0.5 w-6 h-6 shrink-0 rounded-lg bg-m3-primary/10 text-m3-primary flex items-center justify-center">
      {icon}
    </div>
    <div>
      <p className="text-[13px] font-bold text-m3-text/80 leading-tight">{title}</p>
      {hint && <p className="text-[11px] font-medium text-m3-secondary mt-0.5">{hint}</p>}
    </div>
  </div>
);

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="block text-label ml-1 mb-1.5">{children}</label>
);

const fieldInputClass =
  "w-full h-11 pl-10 pr-3 bg-m3-sidebar border border-m3-border rounded-md text-sm font-semibold focus:outline-none focus:border-m3-primary transition-colors";

const IconButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "default" | "danger";
  }
> = ({ className = "", variant = "default", ...props }) => (
  <button
    type="button"
    className={`w-9 h-9 shrink-0 rounded-lg border flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer ${
      variant === "danger"
        ? "border-red-200 dark:border-red-900/60 text-m3-danger hover:bg-m3-danger/10"
        : "border-m3-border text-m3-secondary hover:border-m3-primary/50 hover:text-m3-primary"
    } ${className}`}
    {...props}
  />
);

const EVENT_TYPE_PRESETS = [
  "Culto Dominical",
  "Estudo Bíblico",
  "Reunião de Oração",
  "Ensaio de Louvor",
  "Culto de Jovens",
  "Reunião de Liderança",
];

const EVENT_COLOR_OPTIONS: TEventColor[] = [
  "blue",
  "green",
  "red",
  "yellow",
  "purple",
  "orange",
  "gray",
];

const EVENT_COLOR_CLASSES: Record<TEventColor, string> = {
  blue: "bg-blue-500",
  green: "bg-emerald-500",
  red: "bg-red-500",
  yellow: "bg-amber-400",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
  gray: "bg-neutral-500",
};

const DURATION_PRESETS = [30, 45, 60, 90, 120];
const NOTES_MAX = 500;

export interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: EventFormValue) => void;
  onDelete?: () => void;
  initial?: Partial<EventFormValue>;
  title?: string;
  submitLabel?: string;
  services?: Service[];
  servicesLoading?: boolean;
  usualStartTime?: string;
}

const emptyEventForm = (
  initial: Partial<EventFormValue> | undefined,
  usualStartTime: string,
): EventFormValue => {
  return {
    title: initial?.title ?? "",
    type: initial?.type ?? "Culto Dominical",
    date: initial?.date ?? new Date().toISOString().slice(0, 10),
    time: initial?.time ?? usualStartTime,
    durationMinutes: initial?.durationMinutes ?? 90,
    location: initial?.location ?? "",
    notes: initial?.notes ?? "",
    color: initial?.color ?? "blue",
    linkedServiceId: initial?.linkedServiceId ?? null,
  };
};

export const EventFormModal: React.FC<EventFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  initial,
  title = "Event",
  submitLabel = "Save",
  services = [],
  servicesLoading = false,
  usualStartTime = "10:00",
}) => {
  const [form, setForm] = useState<EventFormValue>(() => emptyEventForm(initial, usualStartTime));
  const [titleTouched, setTitleTouched] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(emptyEventForm(initial, usualStartTime));
      setTitleTouched(false);
    }
  }, [isOpen, initial, usualStartTime]);

  const titleIsEmpty = form.title.trim().length === 0;
  const showTitleError = titleTouched && titleIsEmpty;

  const handleSelectService = (serviceId: string | null) => {
    if (!serviceId) {
      setForm((f) => ({ ...f, linkedServiceId: null }));
      return;
    }
    const service = services.find((s) => s.id === serviceId);
    if (!service) {
      setForm((f) => ({ ...f, linkedServiceId: serviceId }));
      return;
    }
    setForm((f) => {
      const nextTitle = f.title.trim().length === 0 ? service.name : f.title;
      const nextDate = service.date ? service.date.slice(0, 10) : f.date;
      const nextDuration = service.elements?.length
        ? serviceTotalMinutes(service)
        : f.durationMinutes;
      return {
        ...f,
        linkedServiceId: serviceId,
        title: nextTitle,
        date: nextDate,
        durationMinutes: nextDuration,
      };
    });
  };

  const adjustDuration = (delta: number) => {
    setForm((f) => ({
      ...f,
      durationMinutes: Math.max(5, Math.min(720, f.durationMinutes + delta)),
    }));
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="xl"
      dataTour="create-event-modal"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setTitleTouched(true);
          if (titleIsEmpty) return;
          onSubmit(form);
        }}
        className="space-y-7 pt-1"
      >
        {/* Linked Service */}
        <section className="space-y-2.5">
          <SectionHeader
            icon={<Layers className="w-3.5 h-3.5" />}
            title="Linked Service"
            hint="Link an order of worship from Services"
          />
          <ServiceLinkField
            services={services}
            isLoading={servicesLoading}
            value={form.linkedServiceId}
            onChange={handleSelectService}
          />
        </section>

        {/* Basic Information */}
        <section className="space-y-2.5">
          <SectionHeader icon={<FileText className="w-3.5 h-3.5" />} title="Information" />
          <div>
            <Input
              label="Title"
              placeholder="e.g. Sunday Morning Service"
              icon={<FileText className="w-4 h-4" />}
              value={form.title}
              onChange={(e) => {
                setForm((f) => ({ ...f, title: e.target.value }));
                if (titleTouched) setTitleTouched(false);
              }}
              onBlur={() => setTitleTouched(true)}
              required
            />
            {showTitleError && (
              <p className="flex items-center gap-1 text-[11px] font-semibold text-m3-danger mt-1.5 ml-1">
                <Info className="w-3 h-3" /> Title is required
              </p>
            )}
          </div>

          <div>
            <FieldLabel>Event Type</FieldLabel>
            <div className="relative">
              <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-m3-secondary pointer-events-none" />
              <input
                list="agenda-event-types"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                placeholder="Type or select a category"
                className={fieldInputClass}
              />
              <datalist id="agenda-event-types">
                {EVENT_TYPE_PRESETS.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <FieldLabel>Color</FieldLabel>
            <div className="flex items-center gap-2 mt-1">
              {EVENT_COLOR_OPTIONS.map((c) => {
                const isSelected = (form.color ?? "blue") === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, color: c }))}
                    className={`size-6 rounded-full transition-transform cursor-pointer ${
                      EVENT_COLOR_CLASSES[c]
                    } ${
                      isSelected
                        ? "ring-2 ring-offset-2 ring-m3-primary scale-110"
                        : "hover:scale-105 opacity-80 hover:opacity-100"
                    }`}
                    title={c}
                  />
                );
              })}
            </div>
          </div>
        </section>

        {/* Date and Time */}
        <section className="space-y-2.5">
          <SectionHeader icon={<Clock className="w-3.5 h-3.5" />} title="Date & Time" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <FieldLabel>Date</FieldLabel>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-m3-secondary pointer-events-none" />
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  required
                  className={fieldInputClass}
                />
              </div>
            </div>

            <div>
              <FieldLabel>Start Time</FieldLabel>
              <div className="relative">
                <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-m3-secondary pointer-events-none" />
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                  required
                  className={fieldInputClass}
                />
              </div>
            </div>
          </div>

          {/* Duration */}
          <div>
            <FieldLabel>Duration</FieldLabel>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Clock3 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-m3-secondary pointer-events-none" />
                <input
                  type="number"
                  min={5}
                  max={720}
                  step={5}
                  value={form.durationMinutes}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      durationMinutes: Math.max(5, Number(e.target.value) || 0),
                    }))
                  }
                  className={fieldInputClass}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-m3-secondary pointer-events-none">
                  minutes
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <IconButton
                  onClick={() => adjustDuration(-15)}
                  disabled={form.durationMinutes <= 5}
                  title="-15 min"
                >
                  <Minus className="w-4 h-4" />
                </IconButton>
                <IconButton
                  onClick={() => adjustDuration(15)}
                  disabled={form.durationMinutes >= 720}
                  title="+15 min"
                >
                  <Plus className="w-4 h-4" />
                </IconButton>
              </div>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {DURATION_PRESETS.map((mins) => {
                const active = form.durationMinutes === mins;
                return (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, durationMinutes: mins }))}
                    className={`text-xs font-bold px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
                      active
                        ? "bg-m3-primary text-white border-m3-primary"
                        : "border-m3-border text-m3-secondary hover:border-m3-primary/40 hover:text-m3-primary"
                    }`}
                  >
                    {mins}m
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Location & Notes */}
        <section className="space-y-2.5">
          <SectionHeader icon={<MapPin className="w-3.5 h-3.5" />} title="Location & Notes" />
          <div>
            <FieldLabel>Location</FieldLabel>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-m3-secondary pointer-events-none" />
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="e.g. Main Sanctuary"
                className={fieldInputClass}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between ml-1 mb-1.5">
              <label className="text-label">Notes</label>
              <span className="text-[10px] text-m3-secondary">
                {form.notes.length}/{NOTES_MAX}
              </span>
            </div>
            <textarea
              value={form.notes}
              maxLength={NOTES_MAX}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Additional information or instructions"
              rows={3}
              className="w-full p-3 bg-m3-sidebar border border-m3-border rounded-md text-sm font-semibold focus:outline-none focus:border-m3-primary transition-colors resize-none"
            />
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-m3-border">
          {onDelete ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon={<Trash2 className="w-4 h-4" />}
              onClick={onDelete}
              className="text-m3-danger hover:text-m3-danger hover:bg-m3-danger/10"
            >
              Delete
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={titleIsEmpty}>
              {submitLabel}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
