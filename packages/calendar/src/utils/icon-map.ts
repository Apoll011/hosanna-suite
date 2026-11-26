// SPDX-License-Identifier: AGPL-3.0-only
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
import type { ResponsibilityColor, ResponsibilityIconKey } from "../interfaces";

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

export const COLOR_MAP: Record<ResponsibilityColor, { bg: string; text: string; ring: string }> = {
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

const GRADIENTS = [
  "from-blue-600 to-indigo-600",
  "from-emerald-500 to-teal-700",
  "from-orange-500 to-amber-600",
  "from-rose-500 to-pink-600",
  "from-purple-600 to-indigo-700",
  "from-cyan-500 to-blue-600",
];

export function getAvatarGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % GRADIENTS.length;
  return GRADIENTS[index];
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
