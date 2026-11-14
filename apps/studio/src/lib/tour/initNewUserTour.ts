/**
 * Marks a freshly created account as eligible for the auto-start product tour.
 * Call after successful sign-up while a session exists.
 */

import { getPersonalSettings, updateAppSettings } from "@hosanna/auth";
import {
  NEW_USER_TOUR_SETTINGS,
  ensureStudioSettingsRegistered,
  studioSettingsScope,
} from "../studioSettings";
import { authClient } from "../authClient";

export async function initializeNewUserTourSettings(): Promise<void> {
  try {
    ensureStudioSettingsRegistered();
    updateAppSettings(studioSettingsScope, NEW_USER_TOUR_SETTINGS);

    const serialized = JSON.stringify(getPersonalSettings());
    await (authClient.updateUser as unknown as (params: { metadata: string }) => Promise<unknown>)({
      metadata: serialized,
    });
  } catch (err) {
    console.warn("Failed to initialize new-user tour settings:", err);
  }
}
