"use client";
import {
  createAppSettingsAccessor,
  defineAppSettingsScope,
  registerAppSettingsScope,
} from "@hosanna/auth";
import type { DashboardLayout } from "@hosanna/dashboard/core";
import { mergeLegacyFavorites } from "./favorites";

export type HomeSettings = {
  layouts: Record<string, DashboardLayout>;
  favorites: string[];
  favoritesMigrated: boolean;
};

const defaults: HomeSettings = { layouts: {}, favorites: [], favoritesMigrated: false };
export const homeSettingsScope = defineAppSettingsScope<HomeSettings>({
  id: "home",
  defaults,
});
registerAppSettingsScope(homeSettingsScope);
export const homeSettings = createAppSettingsAccessor(homeSettingsScope);

export function readLegacyFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("hosanna_suite_favorite_apps");
    const value: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export function migrateLegacyFavorites(): string[] {
  const current = homeSettings.get();
  const migrated = mergeLegacyFavorites({
    favorites: current.favorites,
    migrated: current.favoritesMigrated,
    legacyFavorites: readLegacyFavorites(),
  });
  if (!current.favoritesMigrated) homeSettings.set(migrated);
  return migrated.favorites;
}
