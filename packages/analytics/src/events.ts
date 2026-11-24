// SPDX-License-Identifier: AGPL-3.0-only
export interface StudioEventMap {
  logout: Record<string, never>;
  org_switched: { from_org_id?: string | null; to_org_id: string };
  theme_changed: { theme: string };
  language_changed: { language: string };
  sync_status_changed: { to: string };
  tour_started: { role?: string };
  tour_completed: Record<string, never>;
  explorer_view_changed: { mode: string };
  explorer_density_changed: { density: string };
  explorer_sort_changed: { sort_by: string; order: string };
  folder_created: { parent_id?: string | null };
  folder_renamed: Record<string, never>;
  folder_customized: { has_color: boolean; has_icon: boolean };
  folder_moved: { parent_id?: string | null };
  folder_deleted: { action: string };
  folder_restored: Record<string, never>;
  song_created: { folder_id?: string | null; has_collections: boolean };
  song_saved: { layout_mode?: string };
  song_deleted: Record<string, never>;
  song_restored: Record<string, never>;
  song_moved: { to_folder_id?: string | null };
  songs_batch_tagged: { count: number; mode?: string; tag_count?: number };
  collection_created: { song_count: number };
  collection_updated: { fields: string[] };
  collection_deleted: Record<string, never>;
  collection_restored: Record<string, never>;
  songs_added_to_collection: { count: number };
  songs_removed_from_collection: { count: number };
  service_created: { has_notes: boolean };
  service_deleted: { count: number };
  service_archived: { archived: boolean };
  service_edited: Record<string, never>;
  service_duplicated: { element_count: number };
  service_saved: { element_count: number };
  service_element_added: { element_type?: string };
  service_element_removed: Record<string, never>;
  service_element_reordered: Record<string, never>;
  agenda_event_created: Record<string, never>;
  agenda_event_updated: Record<string, never>;
  agenda_event_deleted: Record<string, never>;
  agenda_event_restored: Record<string, never>;
  agenda_responsibility_added: { assignee_count: number };
  agenda_responsibility_assignees_changed: { assignee_count: number };
  agenda_responsibility_removed: Record<string, never>;
  import_started: { provider_id: string; file_count: number };
  import_completed: { provider_id: string; created: number; failed: number; ignored: number };
  import_failed: { provider_id: string };
  print_initiated: { kind: string; item_count: number };
  print_defaults_saved: Record<string, never>;
}

export type StudioEventName = keyof StudioEventMap;

export const STUDIO_EVENT_NAMES = [
  "logout",
  "org_switched",
  "theme_changed",
  "language_changed",
  "sync_status_changed",
  "tour_started",
  "tour_completed",
  "explorer_view_changed",
  "explorer_density_changed",
  "explorer_sort_changed",
  "folder_created",
  "folder_renamed",
  "folder_customized",
  "folder_moved",
  "folder_deleted",
  "folder_restored",
  "song_created",
  "song_saved",
  "song_deleted",
  "song_restored",
  "song_moved",
  "songs_batch_tagged",
  "collection_created",
  "collection_updated",
  "collection_deleted",
  "collection_restored",
  "songs_added_to_collection",
  "songs_removed_from_collection",
  "service_created",
  "service_deleted",
  "service_archived",
  "service_edited",
  "service_duplicated",
  "service_saved",
  "service_element_added",
  "service_element_removed",
  "service_element_reordered",
  "agenda_event_created",
  "agenda_event_updated",
  "agenda_event_deleted",
  "agenda_event_restored",
  "agenda_responsibility_added",
  "agenda_responsibility_assignees_changed",
  "agenda_responsibility_removed",
  "import_started",
  "import_completed",
  "import_failed",
  "print_initiated",
  "print_defaults_saved",
] as const satisfies readonly StudioEventName[];

export interface AuthEventMap {
  auth_login_attempted: { provider: string; email?: string };
  auth_login_succeeded: { provider: string };
  auth_login_failed: { provider: string; reason?: string };
  auth_signup_attempted: { provider: string; email?: string };
  auth_signup_succeeded: { provider: string };
  auth_signup_failed: { provider: string; reason?: string };
  auth_logout: Record<string, never>;
  auth_session_revoked: Record<string, never>;
  auth_password_reset_requested: Record<string, never>;
  auth_password_reset_completed: Record<string, never>;
  auth_two_factor_prompted: Record<string, never>;
  auth_two_factor_verified: Record<string, never>;
  auth_two_factor_failed: { reason?: string };
  auth_org_created: { org_id?: string; has_logo?: boolean };
  auth_org_switched: { from_org_id?: string | null; to_org_id: string };
  auth_invitation_accepted: { role?: string };
  auth_invitation_sent: { role?: string };
  auth_captcha_failed: { context?: string };
  theme_changed: { theme: string };
  language_changed: { language: string };
  error_boundary_tripped: { digest?: string; component?: string; message?: string };
}

export type AuthEventName = keyof AuthEventMap;

export const AUTH_EVENT_NAMES = [
  "auth_login_attempted",
  "auth_login_succeeded",
  "auth_login_failed",
  "auth_signup_attempted",
  "auth_signup_succeeded",
  "auth_signup_failed",
  "auth_logout",
  "auth_session_revoked",
  "auth_password_reset_requested",
  "auth_password_reset_completed",
  "auth_two_factor_prompted",
  "auth_two_factor_verified",
  "auth_two_factor_failed",
  "auth_org_created",
  "auth_org_switched",
  "auth_invitation_accepted",
  "auth_invitation_sent",
  "auth_captcha_failed",
  "theme_changed",
  "language_changed",
  "error_boundary_tripped",
] as const satisfies readonly AuthEventName[];

export type PostHogEventMap = StudioEventMap;
export type PostHogEventName = StudioEventName;
export const POSTHOG_EVENT_NAMES = STUDIO_EVENT_NAMES;
