import posthog from "posthog-js";
import type { PostHogEventMap, PostHogEventName } from "./events";
import { isPostHogEnabled, POSTHOG_INIT_OPTIONS, resolvePostHogConfig } from "./helpers";

const metaEnv = (import.meta as { env?: Record<string, string | boolean | undefined> }).env;
const env = {
  PROD: metaEnv?.PROD === true,
  VITE_PUBLIC_POSTHOG_KEY: metaEnv?.VITE_PUBLIC_POSTHOG_KEY as string | undefined,
  VITE_PUBLIC_POSTHOG_HOST: metaEnv?.VITE_PUBLIC_POSTHOG_HOST as string | undefined,
  VITE_PUBLIC_POSTHOG_DEV: metaEnv?.VITE_PUBLIC_POSTHOG_DEV as string | undefined,
};

if (!isPostHogEnabled(env)) {
  console.info(
    "PostHog is disabled in development builds, so no events are sent. " +
      'Set VITE_PUBLIC_POSTHOG_DEV="true" and VITE_PUBLIC_POSTHOG_KEY to enable it locally.',
  );
}

const config = resolvePostHogConfig(env);

if (isPostHogEnabled(env) && !config) {
  console.error(
    "VITE_PUBLIC_POSTHOG_KEY or VITE_PUBLIC_POSTHOG_HOST variable required by PostHog is missing or un-configured, " +
      "this causes events to be silently missed. " +
      "This error stops appearing once VITE_PUBLIC_POSTHOG_KEY and VITE_PUBLIC_POSTHOG_HOST are configured",
  );
} else if (config) {
  posthog.init(config.token, {
    api_host: config.host,
    ...POSTHOG_INIT_OPTIONS,
    loaded: () => {
      void posthog.reloadFeatureFlags();
    },
  });
}

function isReady(): boolean {
  return Boolean(config);
}

export function track<K extends PostHogEventName>(name: K, props?: PostHogEventMap[K]): void {
  if (isReady()) {
    posthog.capture(name, props);
  }
}

export function trackPageview(url: string): void {
  if (isReady()) {
    posthog.capture("$pageview", { $current_url: url });
  }
}

export function captureException(error: unknown, props?: Record<string, unknown>): void {
  if (isReady()) {
    posthog.captureException(error, props);
  }
}

export function identify(distinctId: string, props?: Record<string, unknown>): void {
  if (isReady()) {
    posthog.identify(distinctId, props);
  }
}

export { posthog };
