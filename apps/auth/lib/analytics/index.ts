import {
  createAnalyticsClient,
  detectRuntimeEnv,
  getStoredConsent,
  isAnalyticsEnabled,
  posthog,
  resolvePostHogConfig,
  setGlobalAnalyticsClient,
  type AuthEventMap,
} from "@hosanna/analytics";

const env = detectRuntimeEnv();
const enabled = isAnalyticsEnabled(env);
const config = resolvePostHogConfig(env);
const hasConsent = typeof window !== "undefined" ? getStoredConsent()?.choice === "all" : true;

if (!enabled && typeof window !== "undefined") {
  console.info(
    "PostHog is disabled in development builds, so no events are sent. " +
      'Set NEXT_PUBLIC_POSTHOG_DEV="true" and NEXT_PUBLIC_POSTHOG_KEY to enable it locally.',
  );
} else if (enabled && !config && typeof window !== "undefined") {
  console.error(
    "NEXT_PUBLIC_POSTHOG_KEY or NEXT_PUBLIC_POSTHOG_HOST variable required by PostHog is missing or un-configured, " +
      "this causes events to be silently missed. " +
      "This error stops appearing once NEXT_PUBLIC_POSTHOG_KEY and NEXT_PUBLIC_POSTHOG_HOST are configured",
  );
}

export const authAnalytics = createAnalyticsClient<AuthEventMap>({
  appName: "auth",
  apiKey: config?.token,
  apiHost: config?.host,
  enabled: Boolean(config) && hasConsent,
});

setGlobalAnalyticsClient(authAnalytics);

if (typeof window !== "undefined") {
  window.addEventListener("hosanna:cookie-consent-change", () => {
    const consent = getStoredConsent();
    const ph = authAnalytics.getPostHog();
    if (!ph) return;
    if (consent?.choice === "all") {
      ph.opt_in_capturing();
    } else {
      ph.opt_out_capturing();
    }
  });
}

export function track<K extends keyof AuthEventMap>(name: K, props?: AuthEventMap[K]): void {
  authAnalytics.track(name, props);
}

export function trackPageview(url?: string, props?: Record<string, unknown>): void {
  authAnalytics.trackPageview(url, props);
}

export function captureException(error: unknown, props?: Record<string, unknown>): void {
  authAnalytics.captureException(error, props);
}

export function identify(distinctId: string, props?: Record<string, unknown>): void {
  authAnalytics.identify(distinctId, props);
}

export function reset(): void {
  authAnalytics.reset();
}

export { posthog };
