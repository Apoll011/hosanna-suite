// SPDX-License-Identifier: AGPL-3.0-only
import {
  createAnalyticsClient,
  detectRuntimeEnv,
  isAnalyticsEnabled,
  posthog,
  resolvePostHogConfig,
  setGlobalAnalyticsClient,
  type AnalyticsClient,
} from "@hosanna/analytics";
import { getStoredConsent } from "./consent";

let currentClient: AnalyticsClient | null = null;

function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  const consent = getStoredConsent();
  return consent?.choice === "all";
}

export function getSaasAnalytics(): AnalyticsClient {
  if (currentClient) return currentClient;

  const env = detectRuntimeEnv();
  const consentAllowed = hasAnalyticsConsent();
  const enabled = isAnalyticsEnabled(env) && consentAllowed;
  const config = resolvePostHogConfig(env);

  currentClient = createAnalyticsClient({
    appName: "saas",
    apiKey: config?.token,
    apiHost: config?.host,
    enabled: Boolean(config && consentAllowed),
  });

  setGlobalAnalyticsClient(currentClient);
  return currentClient;
}

export function initAnalytics(): AnalyticsClient | null {
  if (typeof window === "undefined") return null;

  if (!hasAnalyticsConsent()) {
    optOutAnalytics();
    return null;
  }

  const client = getSaasAnalytics();
  const rawPh = client.getPostHog();
  if (rawPh) {
    try {
      rawPh.opt_in_capturing();
    } catch {
      /* ignore */
    }
  }

  return client;
}

export function optOutAnalytics(): void {
  if (typeof window === "undefined") return;
  const rawPh = currentClient?.getPostHog() ?? posthog;
  try {
    rawPh?.opt_out_capturing();
    rawPh?.reset();
  } catch {
    /* ignore */
  }
}

export function syncAnalyticsWithConsent(): void {
  if (typeof window === "undefined") return;
  if (hasAnalyticsConsent()) {
    initAnalytics();
  } else {
    optOutAnalytics();
  }
}

export function track(name: string, props?: Record<string, unknown>): void {
  getSaasAnalytics().trackCustom(name, props);
}

export function trackPageview(url?: string, props?: Record<string, unknown>): void {
  getSaasAnalytics().trackPageview(url, props);
}

export function captureException(error: unknown, props?: Record<string, unknown>): void {
  getSaasAnalytics().captureException(error, props);
}

export function identify(distinctId: string, props?: Record<string, unknown>): void {
  getSaasAnalytics().identify(distinctId, props);
}

export function reset(): void {
  getSaasAnalytics().reset();
}

export { posthog };
