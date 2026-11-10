import type { TranslateFn } from "@/lib/i18n";

export function orgInitials(name?: string | null): string {
  if (!name?.trim()) return "·";
  return name
    .split(/\s+/)
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function roleLabel(role: string, t: TranslateFn): string {
  const key = role?.toLowerCase();
  switch (key) {
    case "owner":
      return t("settings.roles.owner");
    case "admin":
      return t("settings.roles.admin");
    case "teamleader":
    case "team_leader":
    case "leader":
      return t("settings.roles.teamLeader");
    case "editor":
      return t("settings.roles.editor");
    case "musician":
      return t("settings.roles.musician");
    case "guest":
      return t("settings.roles.guest");
    case "member":
      return t("settings.roles.member");
    default:
      return role || t("settings.roles.member");
  }
}

export const DEFAULT_ACCENT_COLOR = "#0284c7";

export const PRESET_COLORS = [
  { name: "Sky", hex: "#0284c7" },
  { name: "Ocean", hex: "#5babdb" },
  { name: "Indigo", hex: "#4f46e5" },
  { name: "Emerald", hex: "#059669" },
  { name: "Amber", hex: "#d97706" },
  { name: "Rose", hex: "#e11d48" },
  { name: "Violet", hex: "#7c3aed" },
  { name: "Slate", hex: "#475569" },
] as const;

export type OrgAppearance = {
  accentColor: string;
  showBranding: boolean;
};

export type OrgGeneralSettings = {
  locale: string;
  timezone: string;
  weekStartsOn: number;
};

export const DEFAULT_GENERAL: OrgGeneralSettings = {
  locale: "pt-PT",
  timezone: "Europe/Lisbon",
  weekStartsOn: 1,
};

export function readOrgAppearance(metadata: Record<string, unknown>): OrgAppearance {
  const settings = (metadata.settings as Record<string, unknown> | undefined) || {};
  const appearance = (settings.appearance as Record<string, unknown> | undefined) || {};
  return {
    accentColor:
      typeof appearance.accentColor === "string" && appearance.accentColor
        ? appearance.accentColor
        : DEFAULT_ACCENT_COLOR,
    showBranding: appearance.showBranding !== false,
  };
}

export function readOrgGeneral(metadata: Record<string, unknown>): OrgGeneralSettings {
  const settings = (metadata.settings as Record<string, unknown> | undefined) || {};
  const general = (settings.general as Record<string, unknown> | undefined) || {};
  return {
    locale: typeof general.locale === "string" ? general.locale : DEFAULT_GENERAL.locale,
    timezone: typeof general.timezone === "string" ? general.timezone : DEFAULT_GENERAL.timezone,
    weekStartsOn:
      typeof general.weekStartsOn === "number"
        ? general.weekStartsOn
        : DEFAULT_GENERAL.weekStartsOn,
  };
}

export const selectClass =
  "w-full rounded-md border border-m3-border bg-m3-card text-m3-text text-sm px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-m3-primary/25 focus:border-m3-primary disabled:opacity-60 disabled:bg-m3-sidebar transition-colors cursor-pointer";
