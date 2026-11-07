/**
 * Imperative API so Settings / command palette can relaunch the product tour
 * without tight coupling to the React controller.
 */

type Starter = () => void;

let productTourStarter: Starter | null = null;

export function registerProductTourStarter(starter: Starter | null): void {
  productTourStarter = starter;
}

export function startProductTour(): boolean {
  if (!productTourStarter) return false;
  productTourStarter();
  return true;
}

/** Opens the isolated interactive onboarding tab (wired in Phase B). */
type InteractiveStarter = () => void;
let interactiveStarter: InteractiveStarter | null = null;

export function registerInteractiveOnboardingStarter(
  starter: InteractiveStarter | null,
): void {
  interactiveStarter = starter;
}

export function startInteractiveOnboarding(): boolean {
  if (!interactiveStarter) return false;
  interactiveStarter();
  return true;
}
