/**
 * Surgical navigation policy for interactive onboarding.
 *
 * Navigate must keep working for Drive ↔ Songs ↔ Agenda ↔ Events, etc.
 * We only block the automatic "open detail after create" hop while the
 * tour is specifically waiting for that create action.
 */

import type { To } from "react-router-dom";
import type { OnboardingEventName } from "./events";

let activeWaitFor: OnboardingEventName | null = null;

export function setActiveOnboardingWaitFor(
  name: OnboardingEventName | null,
): void {
  activeWaitFor = name;
}

export function getActiveOnboardingWaitFor(): OnboardingEventName | null {
  return activeWaitFor;
}

function pathOf(to: To): string {
  if (typeof to === "string") return to;
  return to.pathname || "";
}

/** True when `to` is a song/service detail route (not the list). */
function isSongDetailPath(path: string): boolean {
  return /\/songs\/[^/]+\/?$/.test(path);
}

function isServiceDetailPath(path: string): boolean {
  return /\/services\/[^/]+\/?$/.test(path);
}

/**
 * Returns true if this navigation should be skipped during onboarding.
 * Safe to call from the global navigate wrapper — never blocks history
 * back/forward numbers, list routes, or sidebar section changes.
 */
export function shouldBlockOnboardingNavigation(to: To | number): boolean {
  if (typeof to === "number") return false;
  if (!activeWaitFor) return false;

  const path = pathOf(to);

  if (activeWaitFor === "song-created" && isSongDetailPath(path)) {
    return true;
  }
  if (activeWaitFor === "service-created" && isServiceDetailPath(path)) {
    return true;
  }
  return false;
}
