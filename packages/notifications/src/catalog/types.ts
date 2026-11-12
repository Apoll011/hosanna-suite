import type { NotificationTypeDefinition } from "../types.js";

/**
 * Code-defined notification type registry.
 * Callers may still send arbitrary `type` strings; unknown types fall back to
 * product defaults (inbox + push, user-overridable).
 */
export const NOTIFICATION_TYPES: Record<string, NotificationTypeDefinition> = {
  // Auth / security — email always forced
  "auth.verify_email": {
    type: "auth.verify_email",
    category: "security",
    defaultChannels: ["email"],
    forcedChannels: ["email"],
    userOverridable: false,
  },
  "auth.password_reset": {
    type: "auth.password_reset",
    category: "security",
    defaultChannels: ["email"],
    forcedChannels: ["email"],
    userOverridable: false,
  },
  "auth.password_reset_success": {
    type: "auth.password_reset_success",
    category: "security",
    defaultChannels: ["email", "inbox"],
    forcedChannels: ["email"],
    userOverridable: false,
  },
  "auth.otp": {
    type: "auth.otp",
    category: "security",
    defaultChannels: ["email"],
    forcedChannels: ["email"],
    userOverridable: false,
  },
  "auth.change_email": {
    type: "auth.change_email",
    category: "security",
    defaultChannels: ["email"],
    forcedChannels: ["email"],
    userOverridable: false,
  },
  "auth.welcome": {
    type: "auth.welcome",
    category: "auth",
    defaultChannels: ["email", "inbox"],
    userOverridable: true,
  },
  "auth.account_deleted": {
    type: "auth.account_deleted",
    category: "security",
    defaultChannels: ["email"],
    forcedChannels: ["email"],
    userOverridable: false,
  },

  // Org membership
  "org.invitation": {
    type: "org.invitation",
    category: "org",
    defaultChannels: ["email", "inbox"],
    userOverridable: true,
  },
  "org.promoted_admin": {
    type: "org.promoted_admin",
    category: "org",
    defaultChannels: ["email", "inbox", "push"],
    userOverridable: true,
  },
  "org.role_changed": {
    type: "org.role_changed",
    category: "org",
    defaultChannels: ["email", "inbox"],
    userOverridable: true,
  },
  "org.removed": {
    type: "org.removed",
    category: "org",
    defaultChannels: ["email", "inbox"],
    userOverridable: true,
  },

  // Billing
  "billing.trial_started": {
    type: "billing.trial_started",
    category: "billing",
    defaultChannels: ["email", "inbox"],
    userOverridable: true,
  },
  "billing.trial_ended": {
    type: "billing.trial_ended",
    category: "billing",
    defaultChannels: ["email", "inbox"],
    userOverridable: true,
  },
  "billing.trial_expired": {
    type: "billing.trial_expired",
    category: "billing",
    defaultChannels: ["email", "inbox", "push"],
    userOverridable: true,
  },
  "billing.subscribed": {
    type: "billing.subscribed",
    category: "billing",
    defaultChannels: ["email", "inbox"],
    userOverridable: true,
  },
  "billing.canceled": {
    type: "billing.canceled",
    category: "billing",
    defaultChannels: ["email", "inbox"],
    userOverridable: true,
  },

  // Agenda / studio product
  "agenda.reminder": {
    type: "agenda.reminder",
    category: "agenda",
    defaultChannels: ["push", "inbox"],
    userOverridable: true,
  },
  assignment_created: {
    type: "assignment_created",
    category: "agenda",
    defaultChannels: ["inbox", "push"],
    userOverridable: true,
  },
  assignment_removed: {
    type: "assignment_removed",
    category: "agenda",
    defaultChannels: ["inbox", "push"],
    userOverridable: true,
  },
  event_cancelled: {
    type: "event_cancelled",
    category: "agenda",
    defaultChannels: ["inbox", "push", "email"],
    userOverridable: true,
  },
  service_date_changed: {
    type: "service_date_changed",
    category: "agenda",
    defaultChannels: ["inbox", "push"],
    userOverridable: true,
  },
  service_location_changed: {
    type: "service_location_changed",
    category: "agenda",
    defaultChannels: ["inbox", "push"],
    userOverridable: true,
  },
  service_updated: {
    type: "service_updated",
    category: "product",
    defaultChannels: ["inbox", "push"],
    userOverridable: true,
  },

  // Backup
  "backup.restored": {
    type: "backup.restored",
    category: "backup",
    defaultChannels: ["inbox", "email"],
    userOverridable: true,
  },
};

export const DEFAULT_TYPE_DEFINITION: NotificationTypeDefinition = {
  type: "product.generic",
  category: "product",
  defaultChannels: ["inbox", "push"],
  userOverridable: true,
};

export function getTypeDefinition(type: string): NotificationTypeDefinition {
  return NOTIFICATION_TYPES[type] ?? { ...DEFAULT_TYPE_DEFINITION, type };
}
