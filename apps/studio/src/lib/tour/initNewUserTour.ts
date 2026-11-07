/**
 * Marks a freshly created account as eligible for the auto-start product tour.
 * Call after successful sign-up while a session exists.
 */

import {
  DEFAULT_SETTINGS,
  NEW_USER_TOUR_SETTINGS,
  type PersonalSettings,
} from "../../hooks/usePersonalSettings";
import { authClient } from "../authClient";

export async function initializeNewUserTourSettings(): Promise<void> {
  const settings: PersonalSettings = {
    ...DEFAULT_SETTINGS,
    ...NEW_USER_TOUR_SETTINGS,
  };

  try {
    const serialized = JSON.stringify(settings);
    localStorage.setItem("personal-settings", serialized);
    await (
      authClient.updateUser as unknown as (params: {
        metadata: string;
      }) => Promise<unknown>
    )({ metadata: serialized });
  } catch (err) {
    console.warn("Failed to initialize new-user tour settings:", err);
  }
}
