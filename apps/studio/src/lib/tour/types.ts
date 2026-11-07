import type { TranslationKey } from "../i18n";
import type { PermissionString } from "../permissions/permission";
import type { AppRole } from "../permissions/roles";

/** Stable ids for modular tour blocks (permission-driven). */
export type TourBlockId =
  | "welcome"
  | "nav.drive"
  | "nav.library"
  | "nav.collections"
  | "nav.services"
  | "nav.agenda"
  | "toolbar.search"
  | "toolbar.create"
  | "nav.settings"
  | "finish";

export interface TourFeatureFlags {
  collectionsEnabled: boolean;
  agendaEnabled: boolean;
}

export interface TourBlockDefinition {
  id: TourBlockId;
  /** CSS selector for `data-tour` anchors. Omit for centered dialogs. */
  element?: string;
  /** All of these must be granted (empty = always eligible). */
  requireAll?: PermissionString[];
  /** At least one must be granted. */
  requireAny?: PermissionString[];
  /** Extra feature-flag gate. */
  when?: (flags: TourFeatureFlags) => boolean;
  /** Optional per-role override / custom interaction hook id. */
  customScript?: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

export interface ResolvedTourStep {
  id: TourBlockId;
  element?: string;
  side?: TourBlockDefinition["side"];
  align?: TourBlockDefinition["align"];
  customScript?: string;
  title: string;
  description: string;
}

export type TourTranslate = (
  key: TranslationKey,
  params?: Record<string, string | number>,
) => string;

export interface BuildProductTourOptions {
  role: AppRole;
  flags: TourFeatureFlags;
  t: TourTranslate;
}
