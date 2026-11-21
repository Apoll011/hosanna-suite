"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Calendar, Clock, MapPin, Tag, FileText, Check } from "lucide-react";

import { useDisclosure } from "../../hooks/use-disclosure";
import { useCalendar } from "../../contexts/calendar-context";

import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { Textarea } from "../../ui/textarea";
import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "../../ui/dialog";

import type { AgendaEvent } from "../../interfaces";
import type { TEventColor } from "../../types";

interface IProps {
  children?: React.ReactNode;
  startDate?: Date;
  startTime?: { hour: number; minute: number };
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const COLOR_OPTIONS: { color: TEventColor; bg: string; border: string }[] = [
  { color: "blue", bg: "bg-blue-500", border: "border-blue-600" },
  { color: "green", bg: "bg-emerald-500", border: "border-emerald-600" },
  { color: "red", bg: "bg-red-500", border: "border-red-600" },
  { color: "yellow", bg: "bg-amber-400", border: "border-amber-500" },
  { color: "purple", bg: "bg-purple-500", border: "border-purple-600" },
  { color: "orange", bg: "bg-orange-500", border: "border-orange-600" },
  { color: "gray", bg: "bg-neutral-500", border: "border-neutral-600" },
];

const PRESET_TYPES = [
  "Culto Dominical",
  "Ensaio de Louvor",
  "Reunião de Oração",
  "Estudo Bíblico",
  "Reunião de Líderes",
  "Evento Especial",
];

const DURATION_PRESETS = [30, 45, 60, 90, 120];

export function AddEventDialog({
  children,
  startDate,
  startTime,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: IProps) {
  const { createEvent } = useCalendar();
  const disclosure = useDisclosure();

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : disclosure.isOpen;
  const handleOpenChange = (next: boolean) => {
    if (isControlled) {
      controlledOnOpenChange?.(next);
    } else {
      if (next) disclosure.onOpen();
      else disclosure.onClose();
    }
  };

  const initialDateStr = startDate
    ? format(startDate, "yyyy-MM-dd")
    : format(new Date(), "yyyy-MM-dd");
  const initialTimeStr = startTime
    ? `${String(startTime.hour).padStart(2, "0")}:${String(startTime.minute).padStart(2, "0")}`
    : "10:00";

  const [title, setTitle] = useState("");
  const [type, setType] = useState("Culto Dominical");
  const [date, setDate] = useState(initialDateStr);
  const [time, setTime] = useState(initialTimeStr);
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [color, setColor] = useState<TEventColor>("blue");

  useEffect(() => {
    if (startDate) setDate(format(startDate, "yyyy-MM-dd"));
    if (startTime) {
      setTime(
        `${String(startTime.hour).padStart(2, "0")}:${String(startTime.minute).padStart(2, "0")}`,
      );
    }
  }, [startDate, startTime]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newEvent: AgendaEvent = {
      id: crypto.randomUUID(),
      title: title.trim(),
      type: type.trim() || "Geral",
      date,
      time,
      durationMinutes,
      location: location.trim() || null,
      notes: notes.trim() || null,
      color,
      responsibilities: [],
      reminder: { enabled: false, label: "" },
      linkedServiceId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    createEvent(newEvent);
    handleOpenChange(false);
    setTitle("");
    setLocation("");
    setNotes("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Event</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div>
            <label className="block text-xs font-semibold text-m3-text mb-1">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sunday Morning Service"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-m3-text mb-1.5">Color</label>
            <div className="flex items-center gap-2">
              {COLOR_OPTIONS.map((opt) => {
                const isSelected = color === opt.color;
                return (
                  <button
                    key={opt.color}
                    type="button"
                    onClick={() => setColor(opt.color)}
                    className={`size-7 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${
                      opt.bg
                    } ${
                      isSelected
                        ? "ring-2 ring-m3-primary ring-offset-2 scale-110 border-white dark:border-neutral-900"
                        : "border-transparent opacity-80 hover:opacity-100"
                    }`}
                    title={opt.color}
                  >
                    {isSelected && <Check className="size-3.5 text-white stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-m3-text mb-1">Type</label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-m3-secondary pointer-events-none" />
              <Input
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="e.g. Culto Dominical"
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {PRESET_TYPES.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setType(preset)}
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                    type === preset
                      ? "bg-m3-primary/10 border-m3-primary text-m3-primary"
                      : "border-m3-border text-m3-secondary hover:text-m3-text hover:bg-m3-hover"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-m3-text mb-1">Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-m3-secondary pointer-events-none" />
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-m3-text mb-1">Start Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-m3-secondary pointer-events-none" />
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-m3-text">Duration</label>
              <span className="text-xs font-medium text-m3-secondary">{durationMinutes} min</span>
            </div>
            <div className="flex items-center gap-1.5">
              {DURATION_PRESETS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDurationMinutes(d)}
                  className={`flex-1 py-1 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                    durationMinutes === d
                      ? "bg-m3-primary text-white border-m3-primary"
                      : "border-m3-border text-m3-secondary hover:text-m3-text hover:bg-m3-hover"
                  }`}
                >
                  {d}m
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-m3-text mb-1">
              Location (optional)
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-m3-secondary pointer-events-none" />
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Main Auditorium, Room 201, etc."
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-m3-text mb-1">
              Notes (optional)
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 size-4 text-m3-secondary pointer-events-none" />
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional instructions or notes..."
                rows={2}
                className="pl-9 resize-none"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" variant="default" disabled={!title.trim()}>
              Create Event
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
