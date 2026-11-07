/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  BookOpen,
  Camera,
  Heart,
  LucideIcon,
  Mic,
  Monitor,
  Music,
  Sparkles,
  Users,
  Volume2,
} from "lucide-react";
import { ResponsibilityColor, ResponsibilityIconKey } from "@/src/types";

export const ICON_MAP: Record<ResponsibilityIconKey, LucideIcon> = {
  mic: Mic,
  music: Music,
  volume: Volume2,
  light: Sparkles,
  monitor: Monitor,
  book: BookOpen,
  heart: Heart,
  users: Users,
  camera: Camera,
  custom: Sparkles,
};

/**
 * Tailwind color classes for a category "chip". Centralized here so every
 * component that renders a category icon/badge looks consistent.
 */
export const COLOR_MAP: Record<
  ResponsibilityColor,
  { bg: string; text: string; ring: string }
> = {
  amber: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-500",
    ring: "ring-amber-500/20",
  },
  violet: {
    bg: "bg-violet-50 dark:bg-violet-950/40",
    text: "text-violet-500",
    ring: "ring-violet-500/20",
  },
  sky: {
    bg: "bg-sky-50 dark:bg-sky-950/40",
    text: "text-sky-500",
    ring: "ring-sky-500/20",
  },
  rose: {
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-500",
    ring: "ring-rose-500/20",
  },
  emerald: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-500",
    ring: "ring-emerald-500/20",
  },
  cyan: {
    bg: "bg-cyan-50 dark:bg-cyan-950/40",
    text: "text-cyan-500",
    ring: "ring-cyan-500/20",
  },
  slate: {
    bg: "bg-slate-100 dark:bg-slate-800/60",
    text: "text-slate-500",
    ring: "ring-slate-500/20",
  },
  indigo: {
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    text: "text-indigo-500",
    ring: "ring-indigo-500/20",
  },
};
