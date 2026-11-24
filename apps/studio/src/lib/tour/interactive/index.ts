// SPDX-License-Identifier: AGPL-3.0-only
export {
  emitOnboardingEvent,
  onOnboardingEvent,
  waitForOnboardingEvent,
  type OnboardingEventName,
} from "./events";
export {
  buildInteractiveSteps,
  destroyInteractiveOnboarding,
  isInteractiveOnboardingRunning,
  refreshInteractiveOnboarding,
  runInteractiveOnboarding,
  type InteractiveRunOptions,
} from "./engine";
export { INTERACTIVE_MODULES, type InteractiveStepDef } from "./modules";
export {
  captureOnboardingQueryParams,
  disableInteractiveOnboardingSession,
  enableInteractiveOnboardingSession,
  getInteractiveOnboardingRole,
  isInteractiveOnboardingSession,
} from "./session";
export {
  getActiveOnboardingWaitFor,
  setActiveOnboardingWaitFor,
  shouldBlockOnboardingNavigation,
} from "./navigationPolicy";
