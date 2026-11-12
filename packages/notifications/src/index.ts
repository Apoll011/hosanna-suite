export type {
  AppId,
  DispatchInput,
  DispatchResult,
  DispatchTarget,
  EmailOverride,
  EmailSendFn,
  FcmConfig,
  FcmMessage,
  FcmSendResult,
  InboxNotifyFn,
  NotificationCategory,
  NotificationChannel,
  NotificationPreferenceInput,
  NotificationServiceDeps,
  NotificationTypeDefinition,
  PushOverride,
  PushPlatform,
  RegisterDeviceInput,
  ResolvedChannels,
} from "./types.js";

export {
  DEFAULT_TYPE_DEFINITION,
  getTypeDefinition,
  NOTIFICATION_TYPES,
} from "./catalog/types.js";

export { createFcmClient, type FcmClient } from "./channels/fcm.js";

export {
  deletePushDevicesByIds,
  disablePushDevice,
  listEnabledDevicesForUsers,
  migrateSessionFcmToDevices,
  registerPushDevice,
  revokeDevicesForSession,
} from "./devices.js";

export { resolveRecipients } from "./recipients.js";

export {
  getPreferencesForUsers,
  listPreferences,
  resolveChannelsForUser,
  upsertPreference,
} from "./preferences.js";

export { createNotificationService, type NotificationService } from "./service.js";
