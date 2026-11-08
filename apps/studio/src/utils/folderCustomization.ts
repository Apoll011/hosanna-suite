import React from "react";
import {
  Folder as FolderIcon,
  FolderOpen,
  Music,
  Heart,
  Star,
  BookOpen,
  Bookmark,
  Sun,
  Moon,
  Sparkles,
  Flame,
  Cross,
  Church,
  Mic,
  Radio,
  Disc,
  Headphones,
  Guitar,
  Bell,
  Archive,
  Tag,
  Hash,
  Smile,
  Shield,
  Award,
  Crown,
  Compass,
  MapPin,
  Calendar,
  Layers,
  type LucideProps,
} from "lucide-react";

export interface FolderIconOption {
  id: string;
  name: string;
  icon: React.ComponentType<LucideProps>;
}

export const FOLDER_ICONS: FolderIconOption[] = [
  { id: "default", name: "Padrão (Pasta)", icon: FolderIcon },
  { id: "music", name: "Música", icon: Music },
  { id: "heart", name: "Coração / Louvor", icon: Heart },
  { id: "star", name: "Estrela / Favoritos", icon: Star },
  { id: "book-open", name: "Bíblia / Livro", icon: BookOpen },
  { id: "bookmark", name: "Marcador", icon: Bookmark },
  { id: "sun", name: "Sol / Manhã", icon: Sun },
  { id: "moon", name: "Lua / Noite", icon: Moon },
  { id: "sparkles", name: "Especial / Adoração", icon: Sparkles },
  { id: "flame", name: "Fogo / Espírito Santo", icon: Flame },
  { id: "cross", name: "Cruz / Fé", icon: Cross },
  { id: "church", name: "Igreja / Culto", icon: Church },
  { id: "mic", name: "Vocal / Microfone", icon: Mic },
  { id: "radio", name: "Rádio / Transmissão", icon: Radio },
  { id: "disc", name: "Disco / Álbum", icon: Disc },
  { id: "headphones", name: "Áudio / Fones", icon: Headphones },
  { id: "guitar", name: "Instrumento / Guitarra", icon: Guitar },
  { id: "bell", name: "Sino / Alerta", icon: Bell },
  { id: "archive", name: "Arquivo / Histórico", icon: Archive },
  { id: "tag", name: "Etiqueta / Categoria", icon: Tag },
  { id: "hash", name: "Tópico / Número", icon: Hash },
  { id: "smile", name: "Kids / Jovens", icon: Smile },
  { id: "shield", name: "Proteção / Salmos", icon: Shield },
  { id: "award", name: "Destaque", icon: Award },
  { id: "crown", name: "Rei / Hosana", icon: Crown },
  { id: "compass", name: "Orientação / Missões", icon: Compass },
  { id: "map-pin", name: "Local / Congregação", icon: MapPin },
  { id: "calendar", name: "Eventos / Datas", icon: Calendar },
  { id: "layers", name: "Grupos / Repertório", icon: Layers },
  { id: "folder-open", name: "Pasta Aberta", icon: FolderOpen },
];

export interface FolderColorOption {
  id: string;
  name: string;
  borderClass: string;
  bgClass: string;
  textClass: string;
  colorHex: string;
}

export const FOLDER_COLORS: FolderColorOption[] = [
  {
    id: "default",
    name: "Padrão",
    borderClass: "border-m3-primary/20",
    bgClass: "bg-m3-primary/10",
    textClass: "text-m3-primary",
    colorHex: "#0284c7",
  },
  {
    id: "red",
    name: "Vermelho",
    borderClass: "border-red-500/20",
    bgClass: "bg-red-500/10",
    textClass: "text-red-500",
    colorHex: "#ef4444",
  },
  {
    id: "orange",
    name: "Laranja",
    borderClass: "border-orange-500/20",
    bgClass: "bg-orange-500/10",
    textClass: "text-orange-500",
    colorHex: "#f97316",
  },
  {
    id: "amber",
    name: "Âmbar",
    borderClass: "border-amber-500/20",
    bgClass: "bg-amber-500/10",
    textClass: "text-amber-500",
    colorHex: "#f59e0b",
  },
  {
    id: "yellow",
    name: "Amarelo",
    borderClass: "border-yellow-500/20",
    bgClass: "bg-yellow-500/10",
    textClass: "text-yellow-500",
    colorHex: "#eab308",
  },
  {
    id: "emerald",
    name: "Esmeralda",
    borderClass: "border-emerald-500/20",
    bgClass: "bg-emerald-500/10",
    textClass: "text-emerald-500",
    colorHex: "#10b981",
  },
  {
    id: "green",
    name: "Verde",
    borderClass: "border-green-500/20",
    bgClass: "bg-green-500/10",
    textClass: "text-green-500",
    colorHex: "#22c55e",
  },
  {
    id: "teal",
    name: "Verde-azulado",
    borderClass: "border-teal-500/20",
    bgClass: "bg-teal-500/10",
    textClass: "text-teal-500",
    colorHex: "#14b8a6",
  },
  {
    id: "cyan",
    name: "Ciano",
    borderClass: "border-cyan-500/20",
    bgClass: "bg-cyan-500/10",
    textClass: "text-cyan-500",
    colorHex: "#06b6d4",
  },
  {
    id: "sky",
    name: "Azul Céu",
    borderClass: "border-sky-500/20",
    bgClass: "bg-sky-500/10",
    textClass: "text-sky-500",
    colorHex: "#0ea5e9",
  },
  {
    id: "blue",
    name: "Azul",
    borderClass: "border-blue-500/20",
    bgClass: "bg-blue-500/10",
    textClass: "text-blue-500",
    colorHex: "#3b82f6",
  },
  {
    id: "indigo",
    name: "Índigo",
    borderClass: "border-indigo-500/20",
    bgClass: "bg-indigo-500/10",
    textClass: "text-indigo-500",
    colorHex: "#6366f1",
  },
  {
    id: "violet",
    name: "Violeta",
    borderClass: "border-violet-500/20",
    bgClass: "bg-violet-500/10",
    textClass: "text-violet-500",
    colorHex: "#8b5cf6",
  },
  {
    id: "purple",
    name: "Roxo",
    borderClass: "border-purple-500/20",
    bgClass: "bg-purple-500/10",
    textClass: "text-purple-500",
    colorHex: "#a855f7",
  },
  {
    id: "fuchsia",
    name: "Fúcsia",
    borderClass: "border-fuchsia-500/20",
    bgClass: "bg-fuchsia-500/10",
    textClass: "text-fuchsia-500",
    colorHex: "#d946ef",
  },
  {
    id: "pink",
    name: "Rosa",
    borderClass: "border-pink-500/20",
    bgClass: "bg-pink-500/10",
    textClass: "text-pink-500",
    colorHex: "#ec4899",
  },
  {
    id: "rose",
    name: "Rose",
    borderClass: "border-rose-500/20",
    bgClass: "bg-rose-500/10",
    textClass: "text-rose-500",
    colorHex: "#f43f5e",
  },
  {
    id: "slate",
    name: "Cinza",
    borderClass: "border-slate-500/20",
    bgClass: "bg-slate-500/10",
    textClass: "text-slate-500",
    colorHex: "#64748b",
  },
];

export function getFolderColorStyle(colorId?: string | null): FolderColorOption {
  if (!colorId || colorId === "default") {
    return FOLDER_COLORS[0];
  }
  return FOLDER_COLORS.find((c) => c.id === colorId) || FOLDER_COLORS[0];
}

export function getFolderIconComponent(iconId?: string | null): React.ComponentType<LucideProps> {
  if (!iconId || iconId === "default") {
    return FolderIcon;
  }
  const match = FOLDER_ICONS.find((i) => i.id === iconId);
  return match ? match.icon : FolderIcon;
}
