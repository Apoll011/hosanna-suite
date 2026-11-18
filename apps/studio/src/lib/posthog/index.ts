import {
  createAnalyticsClient,
  detectRuntimeEnv,
  isAnalyticsEnabled,
  posthog,
  resolvePostHogConfig,
  setGlobalAnalyticsClient,
  type StudioEventMap,
} from "@hosanna/analytics";

const env = detectRuntimeEnv();
const enabled = isAnalyticsEnabled(env);
const config = resolvePostHogConfig(env);

if (!enabled) {
  console.info(
    "PostHog is disabled in development builds, so no events are sent. " +
      'Set VITE_PUBLIC_POSTHOG_DEV="true" and VITE_PUBLIC_POSTHOG_KEY to enable it locally.',
  );
} else if (!config) {
  console.error(
    "VITE_PUBLIC_POSTHOG_KEY or VITE_PUBLIC_POSTHOG_HOST variable required by PostHog is missing or un-configured, " +
      "this causes events to be silently missed. " +
      "This error stops appearing once VITE_PUBLIC_POSTHOG_KEY and VITE_PUBLIC_POSTHOG_HOST are configured",
  );
}

export const studioAnalytics = createAnalyticsClient<StudioEventMap>({
  appName: "studio",
  apiKey: config?.token,
  apiHost: config?.host,
  enabled: Boolean(config),
});

setGlobalAnalyticsClient(studioAnalytics);

export function track<K extends keyof StudioEventMap>(name: K, props?: StudioEventMap[K]): void {
  studioAnalytics.track(name, props);
}

export function trackPageview(url: string): void {
  studioAnalytics.trackPageview(url);
}

export function captureException(error: unknown, props?: Record<string, unknown>): void {
  studioAnalytics.captureException(error, props);
}

export function identify(distinctId: string, props?: Record<string, unknown>): void {
  studioAnalytics.identify(distinctId, props);
}

export { posthog };
