/**
 * Session flags for interactive onboarding inside an isolated demo tab.
 */

import type { AppRole } from "../../permissions/roles";
import { roles } from "../../permissions/roles";

export const DEMO_ONBOARDING_KEY = "demo_onboarding";
export const DEMO_ONBOARDING_ROLE_KEY = "demo_onboarding_role";

export function isInteractiveOnboardingSession(): boolean {
  try {
    return sessionStorage.getItem(DEMO_ONBOARDING_KEY) === "true";
  } catch {
    return false;
  }
}

export function enableInteractiveOnboardingSession(role?: string): void {
  try {
    sessionStorage.setItem(DEMO_ONBOARDING_KEY, "true");
    if (role && role in roles) {
      sessionStorage.setItem(DEMO_ONBOARDING_ROLE_KEY, role);
    }
  } catch {
    // ignore
  }
}

export function disableInteractiveOnboardingSession(): void {
  try {
    sessionStorage.removeItem(DEMO_ONBOARDING_KEY);
    sessionStorage.removeItem(DEMO_ONBOARDING_ROLE_KEY);
  } catch {
    // ignore
  }
}

export function getInteractiveOnboardingRole(): AppRole {
  try {
    const raw = sessionStorage.getItem(DEMO_ONBOARDING_ROLE_KEY);
    if (raw && raw in roles) return raw as AppRole;
  } catch {
    // ignore
  }
  return "owner";
}

/** Parse `/demo?onboarding=1&role=editor` into session flags (call before enableDemoMode). */
export function captureOnboardingQueryParams(
  search: string = typeof window !== "undefined" ? window.location.search : "",
): void {
  const params = new URLSearchParams(search);
  const onboarding =
    params.get("onboarding") === "1" || params.get("onboarding") === "true";
  if (!onboarding) return;
  const role = params.get("role") ?? undefined;
  enableInteractiveOnboardingSession(role ?? undefined);
}
