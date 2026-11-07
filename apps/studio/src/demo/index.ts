/**
 * Demo Mode — central flag helpers + safe demo storage wipe.
 *
 * The presence of the `isDemo` key in sessionStorage drives every
 * demo-mode branch throughout the app. Use these helpers instead of
 * touching sessionStorage directly so the key name stays in one place.
 */

import {
  DEMO_DATABASE_NAMES,
  DEMO_CHECKPOINT_LS_PREFIX,
  DEMO_EPOCH_LS_KEY,
  deleteIndexedDbByName,
} from "../db/dbNames";

export {
  DEMO_ORG_SLUG,
  DEMO_SEEDED_KEY,
  DEMO_SESSION_KEY,
  disableDemoMode,
  enableDemoMode,
  isDemoMode,
  isDemoSeeded,
  markDemoSeeded,
} from "./flags";

import { disableDemoMode } from "./flags";

/**
 * Wipes demo-scoped IndexedDB + demo checkpoint keys, resets DB/replication
 * singletons, and clears demo session flags.
 *
 * Never deletes the production `hosana_idb` / `hosana_checkpoints` databases.
 *
 */
export async function clearDemoData(): Promise<void> {
  disableDemoMode();

  try {
    const { disableInteractiveOnboardingSession } =
      await import("../lib/tour/interactive/session");
    disableInteractiveOnboardingSession();
  } catch {
    // ignore
  }

  try {
    const { resetDatabase } = await import("../db/database");
    resetDatabase();
  } catch {
    // ignore if not yet loaded
  }
  try {
    const { resetReplication } = await import("../db/replication");
    resetReplication();
  } catch {
    // ignore if not yet loaded
  }

  await Promise.all(
    DEMO_DATABASE_NAMES.map((name) => deleteIndexedDbByName(name)),
  );

  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (
        key === DEMO_EPOCH_LS_KEY ||
        key.startsWith(`${DEMO_CHECKPOINT_LS_PREFIX}_`)
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch {
    // localStorage unavailable
  }
}
