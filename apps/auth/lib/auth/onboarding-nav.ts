// SPDX-License-Identifier: AGPL-3.0-only
export type OnboardingNavLink =
  | { id: "home"; href: "/home"; labelKey: "common.goHome" }
  | { id: "account"; href: "/account"; labelKey: "home.nav.account" };

/** `/home` bounces users without an organization back to `/onboarding`. */
export function onboardingNavLinks(organizationCount: number): OnboardingNavLink[] {
  const account: OnboardingNavLink = {
    id: "account",
    href: "/account",
    labelKey: "home.nav.account",
  };
  if (organizationCount === 0) return [account];
  return [{ id: "home", href: "/home", labelKey: "common.goHome" }, account];
}
